import { FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";

interface ProfileHeaderProps {
  rollNo: string;
  course: string;
  branch: string;
  semester: number;
}

export function ProfileHeader({
  rollNo,
  course,
  branch,
  semester,
}: ProfileHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{rollNo}</h1>
        <p className="text-sm text-muted-foreground">
          {course} · {branch} · Semester {semester}
        </p>
      </div>
      <Button onClick={() => navigate("/student/cv")}>
        <FileText className="h-4 w-4 mr-2" /> Generate CV
      </Button>
    </div>
  );
}
