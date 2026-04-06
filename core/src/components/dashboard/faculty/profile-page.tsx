"use client";

import { Award, Briefcase, Mail, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { PageLoader } from "@/components/dashboard/ui/Spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  image?: string;
  joinDate?: string;
}

const mockFaculty: FacultyProfile = {
  id: "fac-1",
  name: "Dr. Jane Doe",
  email: "jane.doe@example.com",
  department: "Computer Science and Engineering",
  designation: "Associate Professor",
  joinDate: "2018-07-15",
};

export default function FacultyProfilePage() {
  const [data, setData] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetching
    setTimeout(() => {
      setData(mockFaculty);
      setLoading(false);
    }, 400);
  }, []);

  if (loading || !data) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="Faculty Profile"
        subtitle="Your personal and professional details"
      />

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start p-6 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-r from-teal-600 to-emerald-600"></div>
          <div className="relative mt-8 md:mt-8 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            <div className="relative group shrink-0">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-white">
                {data.image && (
                  <AvatarImage
                    src={data.image}
                    alt={data.name}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-4xl bg-slate-100 text-slate-500 font-medium">
                  {data.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 text-center md:text-left pb-1">
              <h2 className="text-3xl font-bold text-slate-800">{data.name}</h2>
              <p className="text-slate-500 font-medium mt-1">
                {data.designation} • {data.department}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full tracking-wide uppercase">
                  Faculty Member
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {data.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <Card>
          <CardHeader
            title="Professional Details"
            icon={<User size={18} />}
            description="Read-only view of your registered information"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={data.name}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={data.email}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={data.department}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Designation
              </label>
              <input
                type="text"
                value={data.designation}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            {data.joinDate && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Join Date
                </label>
                <input
                  type="text"
                  value={new Date(data.joinDate).toLocaleDateString()}
                  disabled
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
