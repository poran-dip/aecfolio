import { DropZone } from "~/components/protected/faculty/import-students/drop-zone";
import { ImportResultCard } from "~/components/protected/faculty/import-students/import-result";
import { ImportToolbar } from "~/components/protected/faculty/import-students/import-toolbar";
import { StudentPreviewTable } from "~/components/protected/faculty/import-students/student-preview-table";
import { useImport } from "~/components/protected/faculty/import-students/use-import";

export default function ImportStudents() {
  const {
    rows,
    fileRef,
    importing,
    result,
    errorCount,
    validCount,
    updateRow,
    removeRow,
    handleFile,
    handleDrop,
    handleImport,
    clearAll,
  } = useImport();

  return (
    <div className="space-y-6">
      {rows.length === 0 && (
        <DropZone fileRef={fileRef} onFile={handleFile} onDrop={handleDrop} />
      )}
      {rows.length > 0 && (
        <ImportToolbar
          totalCount={rows.length}
          validCount={validCount}
          errorCount={errorCount}
          importing={importing}
          onClear={clearAll}
          onImport={handleImport}
        />
      )}
      {result && <ImportResultCard result={result} />}
      {rows.length > 0 && (
        <StudentPreviewTable
          rows={rows}
          onUpdate={updateRow}
          onRemove={removeRow}
        />
      )}
    </div>
  );
}
