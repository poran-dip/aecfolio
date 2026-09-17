import { Link } from "react-router";
import { cn } from "~/lib/utils";

type LogoProps = {
  className?: string;
  to?: string;
  markOnly?: boolean;
};

export function Logo({ className, to = "/", markOnly = false }: LogoProps) {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2.5 rounded-md", className)}
    >
      <img src="/logo.webp" alt="" width={32} height={32} className="size-8" />
      <span
        className={cn(
          "font-heading text-lg font-semibold tracking-tight text-ink",
          markOnly && "sr-only",
        )}
      >
        AECFolio
      </span>
    </Link>
  );
}
