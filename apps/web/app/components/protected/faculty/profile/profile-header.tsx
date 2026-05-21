import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { FacultyProfile } from "./use-faculty-profile";

export function ProfileHeader({ data }: { data: FacultyProfile }) {
  return (
    <div className="flex items-center gap-3.5">
      <Avatar className="h-13 w-13 shrink-0">
        {data.image && (
          <AvatarImage
            src={data.image}
            alt={data.name}
            className="object-cover"
          />
        )}
        <AvatarFallback className="text-base bg-blue-50 text-blue-600 font-medium">
          {data.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div>
        <span className="text-[15px] font-medium text-slate-800">
          {data.name}
        </span>
        <p className="text-[13px] text-slate-500 mt-0.5">
          {data.faculty.designation} · {data.faculty.department}
        </p>
      </div>
    </div>
  );
}
