import { UploadPurpose } from "@aecfolio/shared";
import { FileText, Paperclip, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ApiErrorWithDetails } from "~/lib/api";
import { type ClaimKind, proofHref } from "~/lib/claims";
import { usePublicApiUrl } from "~/lib/public-env";
import { uploadFile } from "~/lib/upload";

export function ProofField({
  kind,
  entryId,
  proofKey,
  onChange,
}: {
  kind: Extract<ClaimKind, "achievements" | "certifications">;
  entryId: string | null;
  proofKey: string | null;
  onChange: (key: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const apiUrl = usePublicApiUrl();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const href = entryId && proofKey ? proofHref(apiUrl, kind, entryId) : null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">Proof</span>

      {proofKey ? (
        <div className="flex flex-wrap items-center gap-2">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-text hover:underline"
            >
              <FileText className="size-4" />
              Open the attached file
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <FileText className="size-4" />
              Attached, and saved with this entry in a moment
            </span>
          )}

          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onChange(null)}
          >
            <Trash2 />
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? <Spinner size="sm" /> : <Paperclip />}
            {busy ? "Uploading…" : "Attach a file"}
          </Button>
          <span className="text-xs text-ink-subtle">
            JPEG, PNG, WebP or PDF, up to 8 MB.
          </span>
        </div>
      )}

      {error && <p className="text-xs text-danger-text">{error}</p>}

      <p className="text-xs text-ink-faint">
        A reviewer checks this file before the claim is verified. Without it,
        they have only your word.
      </p>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;

          setBusy(true);
          setError(null);
          try {
            onChange(await uploadFile(file, UploadPurpose.PROOF));
          } catch (thrown) {
            setError(
              thrown instanceof ApiErrorWithDetails
                ? thrown.message
                : "That file could not be uploaded.",
            );
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
