"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Navbar({ title, subtitle, actions, className }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between",
        "px-6 py-4 bg-white/80 backdrop-blur-sm",
        "border-b border-slate-200",
        className,
      )}
    >
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Notifications"
          id="navbar-notifications-btn"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
