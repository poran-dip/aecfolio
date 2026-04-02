import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Lock, AlertCircle, XCircle } from "lucide-react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default"
  | "locked";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  icon?: boolean;
}

const variantConfig: Record<
  BadgeVariant,
  { className: string; Icon?: typeof CheckCircle }
> = {
  success: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: CheckCircle,
  },
  warning: {
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Clock,
  },
  danger: {
    className: "bg-red-50 text-red-700 border-red-200",
    Icon: XCircle,
  },
  info: {
    className: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: AlertCircle,
  },
  locked: {
    className: "bg-slate-100 text-slate-600 border-slate-200",
    Icon: Lock,
  },
  default: {
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
};

export function Badge({
  variant = "default",
  children,
  className,
  dot,
  icon = true,
}: BadgeProps) {
  const { className: variantClass, Icon } = variantConfig[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "text-xs font-medium border",
        variantClass,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500 pulse-dot",
            variant === "danger" && "bg-red-500",
            variant === "info" && "bg-blue-500",
            variant === "locked" && "bg-slate-400",
            variant === "default" && "bg-slate-400",
          )}
        />
      )}
      {icon && Icon && !dot && <Icon size={11} />}
      {children}
    </span>
  );
}

export function VerificationBadge({
  verified,
  locked,
}: {
  verified: boolean;
  locked?: boolean;
}) {
  if (locked ?? verified) {
    return (
      <Badge variant="locked" dot>
        Verified & Locked
      </Badge>
    );
  }
  return (
    <Badge variant="warning" dot>
      Pending Verification
    </Badge>
  );
}
