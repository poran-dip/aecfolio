"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  faculty: {
    employeeId: string;
    designation: string;
    department: string;
    createdAt: string;
  };
}

export default function FacultyProfilePage() {
  const [data, setData] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setData(data))
      .catch(() => console.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Spinner />;

  return (
    <div>
      <Card className="p-5">
        <div className="flex items-center gap-3.5">
          <Avatar className="h-13 w-13 shrink-0">
            {data.image && <AvatarImage src={data.image} alt={data.name} className="object-cover" />}
            <AvatarFallback className="text-base bg-blue-50 text-blue-600 font-medium">
              {data.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-[15px] font-medium text-slate-800">{data.name}</span>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {data.faculty.designation} · {data.faculty.department}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={data.name}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={data.email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Department
            </label>
            <input
              id="department"
              type="text"
              value={data.faculty.department}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="designation"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Designation
            </label>
            <input
              id="designation"
              type="text"
              value={data.faculty.designation}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
