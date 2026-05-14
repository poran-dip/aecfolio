"use client";

import { FileOutput, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GenCVPage() {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      // Direct the browser to the PDF API endpoint to trigger a download
      window.open("/api/cv/me", "_blank");
      toast.success("CV Generated Successfully!");
    } catch {
      toast.error("Failed to generate CV. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Left Sidebar - Options */}
      <div className="w-full md:w-80 min-w-[320px border-r border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">
          CV Settings
        </h2>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Template</p>
            <div className="border-2 border-blue-500 rounded-xl p-4 bg-blue-50 relative overflow-hidden cursor-pointer">
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                ACTIVE
              </div>
              <div className="flex gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-200 shadow-sm rounded border border-slate-300 shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm">
                    AEC Standard
                  </h3>
                  <p className="text-xs text-blue-700">
                    Official college layout
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card
            size="sm"
            className="bg-slate-50 border-dashed border-slate-300"
          >
            <p className="text-sm text-slate-600 mb-2 font-medium flex items-center gap-1.5">
              <FileOutput size={16} /> Verified Academic Data
            </p>
            <p className="text-xs text-slate-500">
              Only your faculty-verified SGPA/CGPA will appear on your CV. If
              your CGPA isn't showing, verify your results in the Academic
              section.
            </p>
          </Card>

          <div className="pt-4 mt-auto border-t border-slate-100">
            <Button
              variant="default"
              className="w-full"
              onClick={handleDownload}
            >
              Generate & Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Right Area - Preview Pane */}
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center bg-slate-200/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] overflow-y-auto">
        {/* Visual representation of an A4 paper for preview state before PDF generated */}
        <div className="w-full max-w-200 aspect-[1/1.4] bg-white shadow-xl rounded flex flex-col items-center justify-center text-center p-8 border border-slate-200 relative group overflow-hidden">
          <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm z-10 transition-all duration-300">
            <Button variant="secondary">
              Preview PDF Data
            </Button>
          </div>

          <FileText size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            CV Preview Ready
          </h3>
          <p className="text-slate-500 max-w-sm mb-6">
            Your data will be instantly compiled into the official standard
            template. Information is pulled live from your profile.
          </p>
          <Button
            variant="outline"
            onClick={handleDownload}
          >
            Download the PDF File
          </Button>
        </div>
      </div>
    </div>
  );
}
