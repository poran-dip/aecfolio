import { Link } from "react-router";
import { cn } from "~/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2.5 rounded-md", className)}
    >
      <img src="/logo.webp" alt="" width={32} height={32} className="size-8" />
      <span className="font-heading text-lg font-semibold tracking-tight text-ink">
        AECFolio
      </span>
    </Link>
  );
}
