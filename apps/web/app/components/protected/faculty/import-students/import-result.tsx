import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "~/components/ui/card";
import type { ImportResult } from "./types";

export function ImportResultCard({ result }: { result: ImportResult }) {
  return (
    <Card className="p-4 space-y-2">
      {result.created > 0 && (
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={16} />
          <span className="text-sm">
            {result.created} student(s) successfully imported
          </span>
        </div>
      )}
      {result.errors.map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-red-600">
          <AlertCircle size={16} />
          <span className="text-sm">{e.reason}</span>
        </div>
      ))}
    </Card>
  );
}
