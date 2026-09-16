import { usersTable } from "@aecfolio/db";
import {
  AVATAR_MAX_BYTES,
  UPLOAD_RULES,
  UploadPurpose,
} from "@aecfolio/shared";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { putObject } from "./storage";
import { ownerPrefix, sniffContentType } from "./uploads";

const FETCH_TIMEOUT_MS = 5_000;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type LinkedAccount = {
  userId: string;
  providerId: string;
  idToken?: string | null;
};

export function pictureFromIdToken(idToken: string | null | undefined) {
  const payload = idToken?.split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return typeof claims.picture === "string" ? claims.picture : null;
  } catch {
    return null;
  }
}

export function isGooglePictureUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "googleusercontent.com" ||
        url.hostname.endsWith(".googleusercontent.com"))
    );
  } catch {
    return false;
  }
}

async function download(url: string): Promise<Uint8Array | null> {
  const res = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok || !res.body) return null;

  const declared = Number(res.headers.get("content-length"));
  if (declared > AVATAR_MAX_BYTES) return null;

  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.byteLength;
    if (size > AVATAR_MAX_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function largerGooglePicture(url: string) {
  return url.replace(/=s\d+(-c)?$/, "=s256-c");
}

export async function importGoogleAvatar(account: LinkedAccount) {
  if (account.providerId !== "google") return;

  const picture = pictureFromIdToken(account.idToken);
  if (!picture || !isGooglePictureUrl(picture)) return;

  try {
    const [user] = await db
      .select({ image: usersTable.image })
      .from(usersTable)
      .where(eq(usersTable.id, account.userId))
      .limit(1);
    if (!user || user.image) return;

    const bytes = await download(largerGooglePicture(picture));
    if (!bytes) return;

    const type = sniffContentType(bytes);
    const allowed: readonly string[] =
      UPLOAD_RULES[UploadPurpose.AVATAR].contentTypes;
    if (!type || !allowed.includes(type)) return;

    const key = `${ownerPrefix(UploadPurpose.AVATAR, account.userId)}${createId()}.${EXTENSION[type]}`;
    await putObject(key, bytes, type);

    await db
      .update(usersTable)
      .set({ image: key })
      .where(and(eq(usersTable.id, account.userId), isNull(usersTable.image)));
  } catch (err) {
    console.warn("[auth] could not import the Google avatar:", err);
  }
}
