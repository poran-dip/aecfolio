import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  hover,
  glass,
  padding = "md",
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white",
        "shadow-sm",
        hover && "card-hover cursor-pointer",
        glass && "glass",
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = "blue",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    yellow: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="flex items-center gap-4">
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
          colors[color],
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {trend && <p className="text-xs text-slate-400 mt-0.5">{trend}</p>}
      </div>
    </Card>
  );
}
