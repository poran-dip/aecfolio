"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { templates } from "@/components/templates";
import { Button } from "@/components/ui/button";
import type { StudentWithRelations } from "@/types/cv";
import { toBase64 } from "@/lib/to-base64";

export default function GenerateCVPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentWithRelations | null>(null);
  const [templateKey, setTemplateKey] =
    useState<keyof typeof templates>("professional");
  const [generating, setGenerating] = useState(false);

  const TemplateComponent = templates[templateKey];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cv/me");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleDownload = async () => {
    setGenerating(true);
    let processedData = data;
      if (data?.user.image) {
        try {
          const base64 = await toBase64(data.user.image);
          processedData = { ...data, user: { ...data.user, image: base64 } };
        } catch {
          console.warn("[download] Failed to inline profile image");
        }
      }
    try {
      const res = await fetch("/api/cv/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: templateKey,
          data: processedData,
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.user.name ?? "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CV generated successfully!");
    } catch {
      toast.error("Failed to generate CV. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Error</div>;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Left Sidebar - Options */}
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
                  <div
                    key={key}
                    onClick={() => setTemplateKey(key)}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition
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
                          {key === "professional" && "Official college layout"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <div className="pt-4 mt-auto border-t border-slate-100">
            <Button
              variant="default"
              className="w-full"
              onClick={handleDownload}
              disabled={generating}
            >
              {generating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center bg-slate-200/50 overflow-y-auto">
        <div className="w-full max-w-200 shadow-xl overflow-hidden">
          <div className="w-full max-w-[210mm] mx-auto shadow-xl overflow-hidden">
            <TemplateComponent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
