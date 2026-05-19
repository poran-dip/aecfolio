import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import PendingForm from "./form";
import SubmittedScreen from "./submitted";

export default function PendingApprovalScreen() {
  const [mode, setMode] = useState<"loading" | "form" | "review">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [form, setForm] = useState({
    rollNo: "",
    course: "",
    branch: "",
    semester: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    fetch("/api/me/onboarding")
      .then((res) => {
        if (res.status === 404) {
          setMode("form");
          return null;
        }
        if (!res.ok) {
          setMode("form");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setForm({
          rollNo: data.data.rollNo,
          course: data.data.course,
          branch: data.data.branch,
          semester: String(data.data.semester),
        });
        setIsExisting(true);
        setMode("review");
      })
      .catch(() => setMode("form"));
  }, []);

  const handleSubmit = async () => {
    if (!form.rollNo || !form.course || !form.branch || !form.semester) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/me/onboarding", {
        method: isExisting ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, semester: Number(form.semester) }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error?.message ?? "Something went wrong");
        return;
      }
      setIsExisting(true);
      setMode("review");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "loading")
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner />
      </div>
    );

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
