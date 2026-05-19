import { Branch, Course } from "@aecfolio/shared";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";

type PendingFormProps = {
  form: { rollNo: string; course: string; branch: string; semester: string };
  set: (field: string, value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
};

export default function PendingForm({
  form,
  set,
  submitting,
  onSubmit,
}: PendingFormProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full p-6 space-y-6">
        <div className="space-y-1">
          <Badge variant="secondary">One last step</Badge>
          <h1 className="text-xl font-bold text-foreground">
            Complete your profile
          </h1>
          <p className="text-sm text-foreground/70">
            Fill in your academic details so faculty can verify your account.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Roll Number *</Label>
            <input
              value={form.rollNo}
              onChange={(e) => set("rollNo", e.target.value)}
              placeholder="e.g. CSE23001"
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Course *</Label>
            <select
              value={form.course}
              onChange={(e) => set("course", e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
            >
              <option value="">Select</option>
              {Object.values(Course).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Branch *</Label>
            <select
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
            >
              <option value="">Select</option>
              {Object.values(Branch).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Semester *</Label>
            <select
              value={form.semester}
              onChange={(e) => set("semester", e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
            >
              <option value="">Select</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={submitting} className="w-full">
          {submitting ? "Submitting..." : "Submit for Approval"}
        </Button>
      </Card>
    </div>
  );
}
