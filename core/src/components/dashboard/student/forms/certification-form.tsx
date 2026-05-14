"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormActions from "./form-actions";

type CertificationDraft = {
  name: string;
  issuer: string;
  issueDate: string | null;
  proofImage: string | null;
};

export default function CertificationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: CertificationDraft;
  onSave: (data: CertificationDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="space-y-3 mt-3 p-3 border rounded-md bg-muted/30">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            className="h-8 text-xs"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Issuer</Label>
          <Input
            className="h-8 text-xs"
            value={draft.issuer}
            onChange={(e) =>
              setDraft((d) => ({ ...d, issuer: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Issue Date</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={draft.issueDate?.slice(0, 10) ?? ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, issueDate: e.target.value || null }))
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Proof Image URL (optional)</Label>
        <Input
          className="h-8 text-xs"
          value={draft.proofImage ?? ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, proofImage: e.target.value || null }))
          }
        />
      </div>
      <FormActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}
