import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

type SubmittedScreenProps = {
  form: { rollNo: string; course: string; branch: string; semester: string };
  onEdit: () => void;
};

const SubmittedScreen = ({ form, onEdit }: SubmittedScreenProps) => {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full p-6 space-y-6">
        <div className="space-y-1">
          <Badge variant="secondary">Details submitted</Badge>
          <h1 className="text-xl font-bold text-foreground">
            Awaiting approval
          </h1>
          <p className="text-sm text-foreground/70">
            Your details have been submitted. A faculty member will review and
            approve your account shortly.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-foreground/60">Roll Number</div>
          <div className="font-medium">{form.rollNo}</div>
          <div className="text-foreground/60">Course</div>
          <div className="font-medium">{form.course}</div>
          <div className="text-foreground/60">Branch</div>
          <div className="font-medium">{form.branch}</div>
          <div className="text-foreground/60">Semester</div>
          <div className="font-medium">Semester {form.semester}</div>
        </div>
        <Button variant="outline" className="w-full" onClick={onEdit}>
          Edit Details
        </Button>
      </Card>
    </div>
  );
};

export default SubmittedScreen;
