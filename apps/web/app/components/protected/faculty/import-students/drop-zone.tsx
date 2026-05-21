import { Upload } from "lucide-react";
import type { RefObject } from "react";

interface DropZoneProps {
  fileRef: RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function DropZone({ fileRef, onFile, onDrop }: DropZoneProps) {
  return (
    <button
      type="button"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => fileRef.current?.click()}
      className="w-full border-2 border-dashed border-slate-300 rounded-xl px-16 py-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
    >
      <Upload className="mx-auto mb-3 text-slate-400" size={32} />
      <p className="text-slate-600 font-medium">
        Drop a CSV or Excel file here
      </p>
      <p className="text-slate-400 text-sm mt-1">or click to browse</p>
      <p className="text-slate-400 text-xs mt-3">
        Accepts: name, email, roll no, course, branch, semester, cgpa
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </button>
  );
}
