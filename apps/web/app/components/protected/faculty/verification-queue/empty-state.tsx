import { Check } from "lucide-react";
import { Card } from "~/components/ui/card";

export function EmptyState() {
  return (
    <Card className="text-center py-12">
      <Check className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
      <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
      <p className="text-slate-500 mt-2">
        There are no pending items to verify.
      </p>
    </Card>
  );
}
