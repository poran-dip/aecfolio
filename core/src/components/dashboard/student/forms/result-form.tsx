"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormActions from "./form-actions";

type ResultDraft = {
  semester: number;
  pendingSgpa: number | null;
};

export default function ResultForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ResultDraft;
  onSave: (data: ResultDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="space-y-3 mt-3 p-3 border rounded-md bg-muted/30">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Semester</Label>
          <Input
            type="number"
            min={1}
            max={8}
            className="h-8 text-xs"
            value={draft.semester ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, semester: Number(e.target.value) }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pending SGPA</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={10}
            className="h-8 text-xs"
            value={draft.pendingSgpa ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                pendingSgpa: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </div>
      </div>
      <FormActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}
