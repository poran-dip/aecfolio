import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export type TabItem = {
  key: string;
  label: ReactNode;
  to: string;
  count?: number;
};

export function LinkTabs({
  items,
  activeKey,
  className,
}: {
  items: readonly TabItem[];
  activeKey: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-lg bg-surface-sunken p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Link
            key={item.key}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-surface-raised text-ink shadow-xs"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-ink-subtle" : "text-ink-faint",
                )}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
