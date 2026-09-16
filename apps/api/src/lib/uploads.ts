import {
  DOWNLOAD_URL_TTL_SECONDS,
  UPLOAD_RULES,
  UPLOAD_URL_TTL_SECONDS,
  UploadPurpose,
  type UploadTicket,
} from "@aecfolio/shared";
import { createId } from "@paralleldrive/cuid2";
import type { Context } from "hono";
import { fail } from "./response";
import {
  headObject,
  presignGet,
  presignPut,
  readObjectPrefix,
} from "./storage";

const PREFIX: Record<UploadPurpose, string> = {
  [UploadPurpose.PROOF]: "proofs",
  [UploadPurpose.AVATAR]: "avatars",
};

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function ownerPrefix(purpose: UploadPurpose, ownerId: string) {
  return `${PREFIX[purpose]}/${ownerId}/`;
}

export async function issueUpload(
  purpose: UploadPurpose,
  ownerId: string,
  contentType: string,
  size: number,
): Promise<UploadTicket> {
  const key = `${ownerPrefix(purpose, ownerId)}${createId()}.${EXTENSION[contentType]}`;
  const { url, headers } = await presignPut(
    key,
    contentType,
    size,
    UPLOAD_URL_TTL_SECONDS,
  );
  return {
    key,
    url,
    method: "PUT",
    headers,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
  };
}

export function sniffContentType(bytes: Uint8Array): string | null {
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.subarray(from, to));

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (b, i) => bytes[i] === b,
    )
  )
    return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  return null;
}

export type UploadCheck = { ok: true } | { ok: false; message: string };

export async function verifyUpload(
  key: string,
  purpose: UploadPurpose,
  ownerId: string,
): Promise<UploadCheck> {
  if (!key.startsWith(ownerPrefix(purpose, ownerId)) || key.includes(".."))
    return { ok: false, message: "That file was not uploaded by you" };

  const head = await headObject(key);
  if (!head) return { ok: false, message: "That file has not been uploaded" };

  const rules = UPLOAD_RULES[purpose];
  if (head.size > rules.maxBytes)
    return { ok: false, message: "That file is too large" };

  const prefix = await readObjectPrefix(key, 12);
  const sniffed = prefix && sniffContentType(prefix);
  if (
    !sniffed ||
    sniffed !== head.contentType ||
    !(rules.contentTypes as readonly string[]).includes(sniffed)
  )
    return {
      ok: false,
      message: `That file is not a valid ${purpose} (${rules.contentTypes.join(", ")})`,
    };

  return { ok: true };
}

export async function rejectInvalidUpload(
  c: Context,
  field: string,
  key: string | null | undefined,
  purpose: UploadPurpose,
  ownerId: string,
  currentKey?: string | null,
): Promise<Response | null> {
  if (!key || key === currentKey) return null;
  const check = await verifyUpload(key, purpose, ownerId);
  if (check.ok) return null;
  return fail(c, "VALIDATION", check.message, 400, [
    { path: [field], message: check.message },
  ]);
}

export async function redirectToObject(
  c: Context,
  key: string,
  disposition = "inline",
) {
  const url = await presignGet(key, DOWNLOAD_URL_TTL_SECONDS, disposition);
  c.header("Cache-Control", "private, no-store");
  return c.redirect(url, 302);
}
