import {
  UPLOAD_RULES,
  type UploadPurpose,
  type UploadTicket,
} from "@aecfolio/shared";
import { ApiErrorWithDetails, parseApi } from "./api";
import { apiBase } from "./config";

export function describeSize(bytes: number): string {
  const mib = bytes / (1024 * 1024);
  return mib >= 1
    ? `${mib.toFixed(mib < 10 ? 1 : 0)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export function checkFile(file: File, purpose: UploadPurpose): string | null {
  const rules = UPLOAD_RULES[purpose];

  if (!(rules.contentTypes as readonly string[]).includes(file.type)) {
    const names = rules.contentTypes
      .map((type) => type.split("/")[1].toUpperCase())
      .join(", ");
    return `That file is a ${file.type || "unknown type"}. Use ${names}.`;
  }

  if (file.size > rules.maxBytes) {
    return `That file is ${describeSize(file.size)}. The limit is ${describeSize(rules.maxBytes)}.`;
  }

  return null;
}

export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
): Promise<string> {
  const problem = checkFile(file, purpose);
  if (problem) throw new ApiErrorWithDetails(problem, "VALIDATION");

  const ticketResponse = await fetch(`${apiBase}/api/uploads`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose,
      contentType: file.type,
      size: file.size,
    }),
  });

  const ticket = await parseApi<UploadTicket>(ticketResponse);

  const put = await fetch(ticket.url, {
    method: ticket.method,
    headers: ticket.headers,
    body: file,
  });

  if (!put.ok) {
    throw new ApiErrorWithDetails(
      "The file could not be uploaded. Try again.",
      "UPLOAD_FAILED",
    );
  }

  return ticket.key;
}
