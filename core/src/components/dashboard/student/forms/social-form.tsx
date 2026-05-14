"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormActions from "./form-actions";

const SOCIAL_TYPES = ["GITHUB", "LINKEDIN", "TWITTER", "PORTFOLIO", "OTHER"];

type SocialDraft = {
  type: string;
  url: string;
};

export default function SocialForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: SocialDraft;
  onSave: (data: SocialDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="space-y-3 mt-3 p-3 border rounded-md bg-muted/30">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Platform</Label>
          <Select value={draft.type} onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOCIAL_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL</Label>
          <Input
            className="h-8 text-xs"
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
          />
        </div>
      </div>
      <FormActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}
