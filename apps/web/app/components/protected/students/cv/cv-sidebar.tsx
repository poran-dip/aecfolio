import { templates } from "@aecfolio/ui";
import { Button } from "~/components/ui/button";

interface CvSidebarProps {
  templateKey: keyof typeof templates;
  onTemplateChange: (key: keyof typeof templates) => void;
  onDownload: () => void;
  generating: boolean;
}

export function CvSidebar({
  templateKey,
  onTemplateChange,
  onDownload,
  generating,
}: CvSidebarProps) {
  return (
    <div className="w-full md:w-80 min-w-80 border-r border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto">
      <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">
        CV Settings
      </h2>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Template</p>

          {(Object.keys(templates) as Array<keyof typeof templates>).map(
            (key) => {
              const isActive = key === templateKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTemplateChange(key)}
                  className={`relative w-full border-2 rounded-xl p-4 cursor-pointer transition
                  ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </div>
                  )}
                  <div className="flex gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-200 rounded border" />
                    <div>
                      <h3 className="font-semibold text-sm capitalize">
                        {key}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {key === "standard" && "Official college layout"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>

        <div className="pt-4 mt-auto border-t border-slate-200">
          <Button
            variant="default"
            className="w-full"
            onClick={onDownload}
            disabled={generating}
          >
            {generating ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
