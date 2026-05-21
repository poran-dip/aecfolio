import { StatsCards } from "~/components/protected/faculty/all-students/stat-cards";
import { StudentFilters } from "~/components/protected/faculty/all-students/student-filters";
import { StudentTable } from "~/components/protected/faculty/all-students/student-table";
import { useDashboard } from "~/components/protected/faculty/all-students/use-dashboard";
import { Spinner } from "~/components/ui/spinner";

export default function FacultyAllStudents() {
  const {
    filtered,
    pendingUsers,
    pendingOverall,
    loading,
    search,
    setSearch,
    batchFilter,
    setBatchFilter,
    courseFilter,
    setCourseFilter,
    minCgpa,
    setMinCgpa,
    selected,
    exporting,
    handleExport,
    toggleOne,
    toggleAll,
  } = useDashboard();

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <StatsCards pendingOverall={pendingOverall} pendingUsers={pendingUsers} />
      <StudentFilters
        search={search}
        onSearchChange={setSearch}
        batchFilter={batchFilter}
        onBatchChange={setBatchFilter}
        courseFilter={courseFilter}
        onCourseChange={setCourseFilter}
        minCgpa={minCgpa}
        onMinCgpaChange={setMinCgpa}
        selectedCount={selected.size}
        exporting={exporting}
        onExport={handleExport}
      />
      <StudentTable
        students={filtered}
        selected={selected}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
      />
    </div>
  );
}
