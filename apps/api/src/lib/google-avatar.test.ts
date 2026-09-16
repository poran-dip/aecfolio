import { usersTable } from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUser, resetDatabase } from "../test/harness";
import { auth } from "./auth";
import { db } from "./db";
import {
  importGoogleAvatar,
  isGooglePictureUrl,
  largerGooglePicture,
  pictureFromIdToken,
} from "./google-avatar";
import { headObject } from "./storage";

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
]);

const idToken = (claims: Record<string, unknown>) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;

const PICTURE = "https://lh3.googleusercontent.com/a/abc=s96-c";

function stubFetch(body: Uint8Array | string, init: ResponseInit = {}) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      async () => new Response(body, { status: 200, ...init }),
    );
}

async function imageOf(userId: string) {
  const [row] = await db
    .select({ image: usersTable.image })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return row?.image ?? null;
}

describe("Google avatar import on first sign-in", () => {
  beforeEach(resetDatabase);
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs from the account-creation hook, which fires only when Google is first linked", () => {
    expect(auth.options.databaseHooks?.account?.create?.after).toBeTypeOf(
      "function",
    );
    expect(auth.options.databaseHooks?.account).not.toHaveProperty("update");
    expect(auth.options.databaseHooks).not.toHaveProperty("session");
  });

  it("stores the picture in the bucket and points users.image at it", async () => {
    const user = await createUser(Role.STUDENT);
    const fetchSpy = stubFetch(PNG);

    await importGoogleAvatar({
      userId: user.id,
      providerId: "google",
      idToken: idToken({ picture: PICTURE }),
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://lh3.googleusercontent.com/a/abc=s256-c",
      expect.objectContaining({ redirect: "error" }),
    );
    const key = await imageOf(user.id);
    expect(key).toMatch(new RegExp(`^avatars/${user.id}/\\w+\\.png$`));
    expect(await headObject(key as string)).toMatchObject({
      contentType: "image/png",
    });
  });

  it("never replaces an avatar the user already has", async () => {
    const user = await createUser(Role.STUDENT);
    await db
      .update(usersTable)
      .set({ image: "avatars/mine.png" })
      .where(eq(usersTable.id, user.id));
    const fetchSpy = stubFetch(PNG);

    await importGoogleAvatar({
      userId: user.id,
      providerId: "google",
      idToken: idToken({ picture: PICTURE }),
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await imageOf(user.id)).toBe("avatars/mine.png");
  });

  it("fetches nothing that is not a Google image host", async () => {
    const user = await createUser(Role.STUDENT);
    const fetchSpy = stubFetch(PNG);

    for (const picture of [
      "http://lh3.googleusercontent.com/a/abc",
      "https://googleusercontent.com.evil.example/a.png",
      "http://garage:3900/storage/x",
    ]) {
      await importGoogleAvatar({
        userId: user.id,
        providerId: "google",
        idToken: idToken({ picture }),
      });
    }

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await imageOf(user.id)).toBeNull();
  });

  it("gives up quietly on something that is not an image, or too large", async () => {
    const user = await createUser(Role.STUDENT);

    stubFetch("<html>not an image</html>");
    await importGoogleAvatar({
      userId: user.id,
      providerId: "google",
      idToken: idToken({ picture: PICTURE }),
    });
    expect(await imageOf(user.id)).toBeNull();

    vi.restoreAllMocks();
    stubFetch(PNG, { headers: { "content-length": String(50 * 1024 * 1024) } });
    await importGoogleAvatar({
      userId: user.id,
      providerId: "google",
      idToken: idToken({ picture: PICTURE }),
    });
    expect(await imageOf(user.id)).toBeNull();
  });

  it("never throws into the sign-in, even when the download fails", async () => {
    const user = await createUser(Role.STUDENT);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      importGoogleAvatar({
        userId: user.id,
        providerId: "google",
        idToken: idToken({ picture: PICTURE }),
      }),
    ).resolves.toBeUndefined();
  });

  it("reads the picture claim and nothing else from the ID token", () => {
    expect(pictureFromIdToken(idToken({ picture: PICTURE }))).toBe(PICTURE);
    expect(pictureFromIdToken(idToken({ name: "x" }))).toBeNull();
    expect(pictureFromIdToken("garbage")).toBeNull();
    expect(pictureFromIdToken(null)).toBeNull();
    expect(isGooglePictureUrl(PICTURE)).toBe(true);
    expect(largerGooglePicture("https://x/a=s96")).toBe("https://x/a=s256-c");
  });
});
