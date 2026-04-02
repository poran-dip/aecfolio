import { Metadata } from "next";
import Image from "next/image";
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
    desc: "Filter students by CGPA & skills",
  },
];

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-end overflow-hidden bg-slate-900">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-1.jpg"
          alt="AEC Campus"
          fill
          priority
          className="object-cover animate-slow-pan"
        />
        <div className="absolute inset-0 bg-blue-950/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-linear-to-r from-slate-900/90 via-slate-900/50 to-slate-900/80 lg:to-transparent" />
      </div>

      {/* Left Panel — Branding */}
      <div className="absolute inset-y-0 left-0 z-10 hidden lg:flex w-full max-w-2xl flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-2xl shadow-xl border border-white/20">
              A
            </div>
            <div>
              <p className="font-bold text-3xl tracking-tight text-white drop-shadow-md">AEC Profiles</p>
              <p className="text-blue-200 font-medium text-lg mt-0.5">Student Information System</p>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold leading-tight mb-6 drop-shadow-lg tracking-tight">
            Your Academic Profile,
            <br />
            <span className="text-blue-300">Verified & Professional.</span>
          </h1>
          <p className="text-blue-50 text-xl leading-relaxed max-w-lg drop-shadow-md font-medium">
            Manage your academic records, showcase your projects, and generate
            standardized CVs — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 mt-12 pb-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-slate-900/60 hover:border-white/20 transition-all duration-300 shadow-xl"
            >
              <div className="text-blue-300 mb-3 bg-white/10 w-fit p-2 rounded-lg">{f.icon}</div>
              <p className="font-semibold text-base text-white">{f.title}</p>
              <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Sign In */}
      <div className="relative z-20 w-full max-w-md p-8 lg:p-10 mx-6 lg:mx-24 glass rounded-4xl shadow-2xl">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
            A
          </div>
          <div>
            <p className="font-bold text-slate-900">AEC Profiles</p>
            <p className="text-slate-500 text-sm">Student Information System</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-slate-600 font-medium mt-2">
            Sign in with your{" "}
            <span className="text-blue-600 font-bold">@aec.ac.in</span>{" "}
            Google account to continue.
          </p>
        </div>

        <a
          href="/dashboard"
          className="w-full flex items-center justify-center gap-3 px-5 py-4 border-2 border-slate-200 rounded-xl text-slate-700 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </a>

        <p className="text-center text-sm text-slate-500 font-medium mt-8 px-4 leading-relaxed">
          Access restricted to{" "}
          <span className="text-slate-700 font-bold">@aec.ac.in</span>{" "}
          accounts only.
          <br />
          Contact your department admin if you need access.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-200/50 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Assam Engineering College
          </p>
        </div>
      </div>
    </div>
  );
}
