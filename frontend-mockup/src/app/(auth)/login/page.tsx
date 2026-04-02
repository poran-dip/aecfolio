import { redirect } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-end overflow-hidden bg-slate-900">
      {/* Animated Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg-1.jpg" 
          alt="AEC Campus" 
          fill 
          priority
          className="object-cover animate-slow-pan"
        />
        {/* Dark multiply blend for contrast */}
        <div className="absolute inset-0 bg-blue-950/40 mix-blend-multiply" />
        {/* Dark gradient fade from left to right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-slate-900/80 lg:to-transparent" />
      </div>

      {/* Left/Foreground Info (Hidden on mobile) */}
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

      {/* Right/Foreground Sign In Panel */}
      <div className="relative z-20 w-full max-w-md p-8 lg:p-10 mx-6 lg:mx-24 glass rounded-[2rem] shadow-2xl">
        <div className="text-center mb-10">
          {/* Mobile logo */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-3xl shadow-xl lg:hidden mb-6">
            A
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-slate-600 font-medium mt-2">
            Sign in to continue to <span className="text-blue-600 font-bold">AEC Profiles</span>
          </p>
        </div>

        {/* Auth Options */}
        <div className="space-y-4">
          <Link
            href="/student"
            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-blue-600 border border-blue-600 rounded-xl text-white font-bold shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Login</span>
          </Link>
          <Link
            href="/student"
            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl text-slate-700 font-bold hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Register</span>
          </Link>
        </div>

        <p className="text-center text-sm text-slate-500 font-medium mt-10 px-4 leading-relaxed">
          Access restricted to{" "}
          <span className="text-slate-700 font-bold">@aecian.ac.in</span>{" "}
          institutional accounts.
        </p>

        <div className="mt-8 pt-8 border-t border-slate-200/50 text-center">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} Assam Engineering College
          </p>
        </div>
      </div>
    </div>
  );
}
