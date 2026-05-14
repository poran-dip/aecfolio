import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import FormActions from "./form-actions";
import { useState } from "react";

const EXPERIENCE_TYPES = ["INTERNSHIP", "JOB", "VOLUNTEER", "FREELANCE", "OTHER"];

type ExperienceDraft = {
  type: string;
  title: string;
  organization: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
};

export default function ExperienceForm({ 
  initial,
  onSave, 
  onCancel,
}: { 
  initial: ExperienceDraft,
  onSave: (data: ExperienceDraft) => void; 
  onCancel: () => void 
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="space-y-3 mt-3 p-3 border rounded-md bg-muted/30">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={draft.type} onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPERIENCE_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input className="h-8 text-xs" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Organization</Label>
        <Input className="h-8 text-xs" value={draft.organization} onChange={(e) => setDraft((d) => ({ ...d, organization: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea className="text-xs resize-none" rows={3} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" className="h-8 text-xs" value={draft.startDate?.slice(0, 10) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value || null }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End Date</Label>
          <Input type="date" className="h-8 text-xs" value={draft.endDate?.slice(0, 10) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value || null }))} />
        </div>
      </div>
      <FormActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}
