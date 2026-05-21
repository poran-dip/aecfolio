import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface ImportToolbarProps {
  totalCount: number;
  validCount: number;
  errorCount: number;
  importing: boolean;
  onClear: () => void;
  onImport: () => void;
}

export function ImportToolbar({
  totalCount,
  validCount,
  errorCount,
  importing,
  onClear,
  onImport,
}: ImportToolbarProps) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{totalCount} rows</Badge>
        {validCount > 0 && (
          <Badge className="bg-emerald-100 text-emerald-700">
            {validCount} valid
          </Badge>
        )}
        {errorCount > 0 && (
          <Badge className="bg-red-100 text-red-700">
            {errorCount} with errors
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
        <Button
          size="sm"
          onClick={onImport}
          disabled={importing || validCount === 0}
        >
          {importing
            ? "Importing..."
            : `Import ${validCount} student${validCount !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
