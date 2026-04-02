import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { GraduationCap, ShieldCheck, FileText, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to AEC Profiles with your institutional Google account.",
};

const features = [
  {
    icon: <GraduationCap size={20} />,
    title: "Academic Records",
    desc: "Faculty-verified CGPA & semester results",
  },
  {
    icon: <FileText size={20} />,
    title: "One-Click CV",
    desc: "Generate department-branded PDF resumes",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Verified Data",
    desc: "Locked & verified academic history",
  },
  {
    icon: <Users size={20} />,
    title: "Placement Ready",
    desc: "Admin can filter by CGPA & skills",
  },
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg">
              A
            </div>
            <div>
              <p className="font-bold text-lg">AEC Profiles</p>
              <p className="text-blue-200 text-sm">Student Information System</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your Academic Profile,
            <br />
            <span className="text-blue-200">Verified & Professional.</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-md">
            Manage your academic records, showcase your projects, and generate
            standardized CVs — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20"
            >
              <div className="text-blue-200 mb-2">{f.icon}</div>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-blue-200 text-xs mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Sign In */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
              A
            </div>
            <div>
              <p className="font-bold text-slate-900">AEC Profiles</p>
              <p className="text-slate-500 text-sm">Student Information System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
          <p className="text-slate-500 mb-8">
            Sign in with your{" "}
            <span className="font-medium text-blue-600">@aecian.ac.in</span>{" "}
            Google account to continue.
          </p>

          {/* Google Sign In Form */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Access restricted to{" "}
            <span className="text-slate-600 font-medium">@aecian.ac.in</span>{" "}
            accounts only.
            <br />
            Contact your department admin if you need access.
          </p>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Assam Engineering College
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
