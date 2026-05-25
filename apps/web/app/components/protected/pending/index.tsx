import type { Branch, Course } from "@aecfolio/shared";
import { useState } from "react";
import { toast } from "sonner";
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";
import PendingForm from "./form";
import SubmittedScreen from "./submitted";

interface Props {
  onboarding: {
    rollNo: string;
    course: Course;
    branch: Branch;
    semester: number;
  } | null;
}

export default function PendingApprovalScreen({ onboarding }: Props) {
  const [mode, setMode] = useState<"form" | "review">(
    onboarding ? "review" : "form",
  );
  const [submitting, setSubmitting] = useState(false);
  const [isExisting, setIsExisting] = useState(!!onboarding);
  const [form, setForm] = useState<{
    rollNo: string;
    course: Course;
    branch: Branch;
    semester: string;
  }>({
    rollNo: onboarding?.rollNo ?? "",
    course: onboarding?.course ?? "BTECH",
    branch: onboarding?.branch ?? "CSE",
    semester: onboarding ? String(onboarding.semester) : "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.rollNo || !form.course || !form.branch || !form.semester) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = isExisting
        ? await apiClient.api.me.onboarding.$patch({
            json: { ...form, semester: Number(form.semester) },
          })
        : await apiClient.api.me.onboarding.$post({
            json: { ...form, semester: Number(form.semester) },
          });

      await parseApi(res);
      setIsExisting(true);
      setMode("review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "review")
    return <SubmittedScreen form={form} onEdit={() => setMode("form")} />;

  return (
    <PendingForm
      form={form}
      set={set}
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );
}
