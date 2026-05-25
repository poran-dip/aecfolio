import type { templates } from "@aecfolio/ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "~/lib/api-client";
import type { StudentWithRelations } from "./types";

export function useCv() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentWithRelations | null>(null);
  const [templateKey, setTemplateKey] =
    useState<keyof typeof templates>("standard");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.api.cv.me.$get();
        if (!res.ok) throw new Error("Failed to load CV data");
        const json = await res.json();
        if (!json.success) throw new Error(json.error.message);
        setData(json.data as unknown as StudentWithRelations);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load CV data",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.api.cv.generate.$post({
        json: { template: templateKey, data: data as Record<string, unknown> },
      });
      if (!res.ok) throw new Error("Failed to generate CV");
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
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to generate CV. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return {
    loading,
    data,
    templateKey,
    setTemplateKey,
    generating,
    handleDownload,
  };
}
