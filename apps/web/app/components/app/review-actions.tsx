import { Check, X } from "lucide-react";
import { useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "~/components/ui/dialog";
import { Field } from "~/components/ui/field";
import { Textarea } from "~/components/ui/input";
import type { ClaimKind } from "~/lib/claims";

export type ReviewSubmit = (input: {
  kind: ClaimKind;
  ids: string[];
  status: "VERIFIED" | "REJECTED";
  rejectionReason?: string;
}) => void;

export function ReviewActions({
  kind,
  ids,
  busy,
  onSubmit,
  size = "sm",
}: {
  kind: ClaimKind;
  ids: string[];
  busy?: boolean;
  onSubmit: ReviewSubmit;
  size?: "sm" | "md";
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const count = ids.length;
  const plural = count === 1 ? "" : "s";

  return (
    <>
      <Button
        size={size}
        disabled={busy || count === 0}
        onClick={() => onSubmit({ kind, ids, status: "VERIFIED" })}
      >
        <Check />
        Verify{count > 1 ? ` ${count}` : ""}
      </Button>

      <Button
        size={size}
        variant="secondary"
        disabled={busy || count === 0}
        onClick={() => setRejecting(true)}
      >
        <X />
        Reject{count > 1 ? ` ${count}` : ""}
      </Button>

      <Dialog
        open={rejecting}
        onOpenChange={(open) => {
          setRejecting(open);
          if (!open) setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader
            title={`Reject ${count} claim${plural}`}
            description="The student sees this reason and can correct the entry and resubmit."
          />
          <DialogBody>
            <Field
              label="Reason"
              required
              hint="Say what is wrong, not just that something is."
            >
              {(props) => (
                <Textarea
                  {...props}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="The certificate scan is unreadable."
                  autoFocus
                />
              )}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={busy || reason.trim().length === 0}
              onClick={() => {
                onSubmit({
                  kind,
                  ids,
                  status: "REJECTED",
                  rejectionReason: reason.trim(),
                });
                setRejecting(false);
                setReason("");
              }}
            >
              Reject {count} claim{plural}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function reviewSubmitter(
  fetcher: FetcherWithComponents<unknown>,
): ReviewSubmit {
  return ({ kind, ids, status, rejectionReason }) => {
    const body = new FormData();
    body.set("intent", "review");
    body.set("kind", kind);
    body.set("status", status);
    if (rejectionReason) body.set("rejectionReason", rejectionReason);
    for (const id of ids) body.append("id", id);

    fetcher.submit(body, { method: "post" });
  };
}
