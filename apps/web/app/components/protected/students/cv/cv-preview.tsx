import { templates } from "@aecfolio/ui";
import type { StudentWithRelations } from "./types";

interface CvPreviewProps {
  data: StudentWithRelations;
  templateKey: keyof typeof templates;
}

export function CvPreview({ data, templateKey }: CvPreviewProps) {
  const TemplateComponent = templates[templateKey];

  return (
    <div className="flex-1 flex items-start justify-center bg-slate-200/50 overflow-y-auto">
      <div className="w-full max-w-200 shadow-xl overflow-hidden">
        <div className="w-full max-w-[210mm] mx-auto shadow-xl overflow-hidden">
          <TemplateComponent data={data} />
        </div>
      </div>
    </div>
  );
}
