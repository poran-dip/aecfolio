import { Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

interface StudentFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  batchFilter: string;
  onBatchChange: (v: string) => void;
  courseFilter: string;
  onCourseChange: (v: string) => void;
  minCgpa: string;
  onMinCgpaChange: (v: string) => void;
  selectedCount: number;
  exporting: boolean;
  onExport: () => void;
}

export function StudentFilters({
  search,
  onSearchChange,
  batchFilter,
  onBatchChange,
  courseFilter,
  onCourseChange,
  minCgpa,
  onMinCgpaChange,
  selectedCount,
  exporting,
  onExport,
}: StudentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search students by name or roll number..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>
      <div className="flex gap-4">
        <select
          value={batchFilter}
          onChange={(e) => onBatchChange(e.target.value)}
          className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
        >
          <option value="ALL">All Batches</option>
          <option value="2024">2026</option>
          <option value="2023">2025</option>
          <option value="2022">2024</option>
        </select>
        <select
          value={courseFilter}
          onChange={(e) => onCourseChange(e.target.value)}
          className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
        >
          <option value="ALL">All Courses</option>
          <option value="BTECH">BTECH</option>
          <option value="MTECH">MTECH</option>
          <option value="MCA">MCA</option>
        </select>
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          placeholder="Min CGPA"
          value={minCgpa}
          onChange={(e) => onMinCgpaChange(e.target.value)}
          className="py-2 pl-3 pr-3 w-28 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
        />
      </div>
      {selectedCount > 0 && (
        <Button onClick={onExport} disabled={exporting} size="sm">
          {exporting ? <Spinner /> : `Export CVs (${selectedCount})`}
        </Button>
      )}
    </div>
  );
}
