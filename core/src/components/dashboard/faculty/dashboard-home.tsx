"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { StatCard, Card, CardHeader } from "@/components/dashboard/ui/Card";
import { PageLoader } from "@/components/dashboard/ui/Spinner";
import { Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalStudents: number;
  pendingVerifications: number;
  recentlyVerified: number;
}

export default function FacultyDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch for stats
    setTimeout(() => {
      setStats({
        totalStudents: 45,
        pendingVerifications: 12,
        recentlyVerified: 8,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading || !stats) return <PageLoader />;

  return (
    <div>
      <Navbar title="Faculty Overview" subtitle="Welcome back, view your quick stats below" />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Assigned Students"
            value={stats.totalStudents}
            icon={<Users size={22} />}
            color="blue"
          />
          <StatCard
            label="Pending Verifications"
            value={stats.pendingVerifications}
            icon={<AlertTriangle size={22} />}
            color={stats.pendingVerifications > 0 ? "yellow" : "green"}
          />
          <StatCard
            label="Recently Verified"
            value={stats.recentlyVerified}
            icon={<CheckCircle size={22} />}
            color="green"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hover>
            <Link href="/dashboard/students" className="block">
              <CardHeader 
                title="Manage Students" 
                description="View and filter all assigned students, check their CGPA, and view their profiles."
                icon={<Users size={18} />}
              />
              <div className="text-sm font-medium text-blue-600 mt-4 flex items-center gap-1">
                View Student Directory &rarr;
              </div>
            </Link>
          </Card>

          <Card hover>
            <Link href="/dashboard/verify" className="block">
              <CardHeader 
                title="Pending Verifications" 
                description="Review and approve/reject pending Results, Achievements, and Certificates."
                icon={<Clock size={18} />}
              />
              <div className="text-sm font-medium text-amber-600 mt-4 flex items-center gap-1">
                Review Pending Items &rarr;
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
