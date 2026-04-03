import { Metadata } from "next";
import Image from "next/image";
import { GraduationCap, FileText, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to AECFolio with your institutional Google account.",
};

const features = [
  { icon: GraduationCap, title: "Academic Records", desc: "Faculty-verified CGPA & results" },
  { icon: FileText,      title: "One-Click CV",      desc: "Department-branded PDF resumes" },
  { icon: ShieldCheck,   title: "Verified Data",     desc: "Locked & audited academic history" },
  { icon: Users,         title: "Placement Ready",   desc: "Filter students by CGPA & skills" },
];

export default function LoginPage() {
  return (
    <div className="flex bg-white dark:bg-slate-950">

      {/* ── Left Panel ── */}
      <div className="relative hidden lg:flex flex-1 flex-col overflow-hidden">
        {/* Background image */}
        <Image
          src="/bg-1.jpg"
          alt="AEC Campus"
          fill
          priority
          className="object-cover opacity-20 grayscale"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-blue-950/80 to-slate-900" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-14">

          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">AECFolio</p>
              <p className="text-xs text-white/40 font-normal">Student Information System</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <h1 className="font-serif text-4xl xl:text-[42px] font-medium text-white leading-[1.18] tracking-tight mb-5">
              Your academic record,{" "}
              <span className="italic text-white/45">
                verified &amp; professional.
              </span>
            </h1>

            <p className="text-sm text-white/40 font-light leading-relaxed max-w-sm">
              Manage academic records, showcase your work, and generate
              standardised CVs — built for students and faculty at AEC.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3 mt-12">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl p-4 transition-colors duration-200"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-500/15 flex items-center justify-center mb-3">
                    <Icon size={13} className="text-blue-300" />
                  </div>
                  <p className="text-[13px] font-medium text-white/85 mb-0.5">{title}</p>
                  <p className="text-xs text-white/35 font-light leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/20 font-light">
            © {new Date().getFullYear()} Assam Engineering College · All rights reserved
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-1 lg:flex-none lg:w-115 items-center justify-center bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 px-8 py-12">
        <div className="w-full max-w-85">

          {/* Mobile wordmark */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">AECFolio</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Student Information System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-[11px] font-medium tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-4">
              Sign In
            </p>
            <h2 className="font-serif text-3xl font-medium text-slate-900 dark:text-white tracking-tight leading-tight mb-2.5">
              Welcome back.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Sign in with your{" "}
              <span className="text-blue-600 dark:text-blue-400 font-medium">@aec.ac.in</span>{" "}
              Google account to access your profile and academic records.
            </p>
          </div>

          {/* Google Button */}
          <Button
            asChild
            variant="outline"
            className="w-full h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 text-slate-800 dark:text-slate-200 font-medium text-sm transition-all duration-150 shadow-sm"
          >
            <a href="/dashboard" className="flex items-center justify-center gap-2.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </a>
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-600 tracking-wide">restricted access</span>
            <Separator className="flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          {/* Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg px-4 py-3.5 mb-8">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Only <span className="font-semibold">@aec.ac.in</span> institutional accounts are
              permitted. Contact your department administrator if you need access.
            </p>
          </div>

          <Separator className="bg-slate-100 dark:bg-slate-800 mb-6" />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 dark:text-slate-600 font-light">
              © {new Date().getFullYear()} Assam Engineering College
            </p>
            <span className="text-[10.5px] text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1">
              AECFolio
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
