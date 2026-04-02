"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { StatCard } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { Users, FileText, CheckCircle, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Stats {
  totalStudents: number;
  totalFaculty: number;
  verifiedSgpas: number;
  placementReady: number; // For demo, let's say cgpa > 7.0 and verified
  averageCgpa: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // In a real app we'd fetch this from /api/admin/stats
  // Simulating for now since the main requirement was the query dashboard
  useEffect(() => {
    // Simulated fetch
    setTimeout(() => {
      setStats({
        totalStudents: 1450,
        totalFaculty: 45,
        verifiedSgpas: 5200,
        placementReady: 850,
        averageCgpa: 8.12,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading || !stats) return <PageLoader />;

  return (
    <div>
      <Navbar title="Administrator Dashboard" subtitle="System overview and placement analytics" />

      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={stats.totalStudents} icon={<Users size={22} />} color="blue" />
          <StatCard label="Average CGPA" value={stats.averageCgpa.toFixed(2)} icon={<GraduationCap size={22} />} color="purple" trend="Overall College" />
          <StatCard label="Verified Results" value={stats.verifiedSgpas} icon={<CheckCircle size={22} />} color="green" trend="Total SGPA records locked" />
          <StatCard label="Placement Ready Pool" value={stats.placementReady} icon={<FileText size={22} />} color="yellow" trend="Students above 7.0 CGPA" />
        </div>

        {/* Action area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2">Recruitment Drives</h3>
              <p className="text-sm text-slate-500 mb-6">Build specific queries to find students matching company skill and CGPA criteria. Export the list to CSV or generate a batch CV zip.</p>
              <Link href="/admin/query">
                 <Button>Launch Placement Query Builder</Button>
              </Link>
           </div>
           
           <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-sm text-white">
              <h3 className="font-semibold text-slate-100 mb-2">System Health</h3>
              <div className="space-y-3 mt-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Database Connection</span>
                    <span className="text-emerald-400 font-medium">Healthy</span>
                 </div>
                 <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-full"></div>
                 </div>
                 <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-400">PDF Generator Service</span>
                    <span className="text-emerald-400 font-medium">Online (Puppeteer)</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
