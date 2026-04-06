"use client";

import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

const studentNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Academic",
    href: "/dashboard/results",
    icon: <GraduationCap size={18} />,
  },
  { label: "Skills", href: "/dashboard/skills", icon: <Code2 size={18} /> },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: <FolderGit2 size={18} />,
  },
  {
    label: "Experience",
    href: "/dashboard/experience",
    icon: <Briefcase size={18} />,
  },
  {
    label: "Achievements",
    href: "/dashboard/achievements",
    icon: <Trophy size={18} />,
  },
  { label: "Generate CV", href: "/dashboard/cv", icon: <FileText size={18} /> },
];

const facultyNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { label: "Students", href: "/dashboard/students", icon: <Users size={18} /> },
  { label: "Verify", href: "/dashboard/verify", icon: <FileText size={18} /> },
  { label: "Profile", href: "/dashboard/settings", icon: <User size={18} /> },
];

interface SidebarProps {
  role: "STUDENT" | "FACULTY" | "ADMIN";
  userName: string;
  userEmail: string;
  userImage?: string | null;
}

export function Sidebar({
  role,
  userName,
  userEmail,
  userImage,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = role === "FACULTY" ? facultyNav : studentNav;

  const roleLabel =
    role === "FACULTY"
      ? "Faculty Advisor"
      : role === "ADMIN"
        ? "Administrator"
        : "Student";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-slate-900 text-slate-300",
        "sidebar-transition overflow-hidden shrink-0 z-40",
        collapsed ? "w-18" : "w-65",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0">
          AEC
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">
              AEC Profiles
            </p>
            <p className="text-xs text-slate-500 truncate">{roleLabel}</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                collapsed && "justify-center",
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-slate-800 p-2 space-y-1">
        {/* User info */}
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg",
            collapsed && "justify-center",
          )}
        >
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover shrink-0 border-2 border-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
            "text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors",
            collapsed && "justify-center",
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
            "text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
