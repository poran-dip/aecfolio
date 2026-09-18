import { VerificationStatus } from "@aecfolio/shared";
import { api, attempt, unwrap } from "./api.server";
import { CLAIM_KINDS, type ClaimKind } from "./claims";

type Decision =
  | { status: typeof VerificationStatus.VERIFIED }
  | {
      status: typeof VerificationStatus.REJECTED;
      rejectionReason: string;
    };

function readDecision(form: FormData): Decision | null {
  const status = form.get("status");

  if (status === VerificationStatus.VERIFIED) {
    return { status: VerificationStatus.VERIFIED };
  }

  if (status === VerificationStatus.REJECTED) {
    const rejectionReason = String(form.get("rejectionReason") ?? "").trim();
    if (!rejectionReason) return null;
    return { status: VerificationStatus.REJECTED, rejectionReason };
  }

  return null;
}

export async function reviewFromForm(request: Request, form: FormData) {
  const kind = String(form.get("kind")) as ClaimKind;
  if (!CLAIM_KINDS.includes(kind)) {
    return {
      ok: false as const,
      message: "Unknown claim type",
      code: "VALIDATION",
    };
  }

  const ids = form.getAll("id").map(String).filter(Boolean);
  if (ids.length === 0) {
    return {
      ok: false as const,
      message: "Select at least one claim",
      code: "VALIDATION",
    };
  }

  const decision = readDecision(form);
  if (!decision) {
    return {
      ok: false as const,
      message: "A rejection needs a reason",
      code: "VALIDATION",
    };
  }

  const client = api(request);

  return attempt(async () => {
    if (ids.length === 1) {
      await unwrap(
        await client.api.verifications[":kind"][":id"].$patch({
          param: { kind, id: ids[0] },
          json: decision,
        }),
      );
      return { reviewed: ids, skipped: [] as { id: string; reason: string }[] };
    }

    return unwrap(
      await client.api.verifications[":kind"].$patch({
        param: { kind },
        json: { ids, decision },
      }),
    );
  });
}
