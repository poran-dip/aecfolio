"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FormActions from "./form-actions";

type AchievementDraft = {
  title: string;
  description: string;
  proofImage: string | null;
};

export default function AchievementForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AchievementDraft;
  onSave: (data: AchievementDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="space-y-3 mt-3 p-3 border rounded-md bg-muted/30">
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input
          className="h-8 text-xs"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea
          className="text-xs resize-none"
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Proof Image URL (optional)</Label>
        <Input
          className="h-8 text-xs"
          value={draft.proofImage ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, proofImage: e.target.value || null }))}
        />
      </div>
      <FormActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}
