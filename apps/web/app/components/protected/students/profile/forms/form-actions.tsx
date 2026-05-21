import { Check, X } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function FormActions({
  onSave,
  onCancel,
  saving = false,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  return (
    <div className="flex gap-2 justify-end">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={onCancel}
        disabled={saving}
      >
        <X className="h-3 w-3 mr-1" /> Cancel
      </Button>
      <Button
        size="sm"
        className="h-7 text-xs"
        onClick={onSave}
        disabled={saving}
      >
        <Check className="h-3 w-3 mr-1" /> {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
