import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function FormActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
        <X className="h-3 w-3 mr-1" /> Cancel
      </Button>
      <Button size="sm" className="h-7 text-xs" onClick={onSave}>
        <Check className="h-3 w-3 mr-1" /> Save
      </Button>
    </div>
  );
}
