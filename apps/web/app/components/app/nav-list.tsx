import { NavLink } from "react-router";
import { CountBadge } from "~/components/ui/badge";
import { Tooltip } from "~/components/ui/tooltip";
import type { NavItem } from "~/lib/nav";
import { cn } from "~/lib/utils";

export type NavCounts = {
  verifications?: number;
};

type NavListProps = {
  items: readonly NavItem[];
  activePath: string | null;
  counts?: NavCounts;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function NavList({
  items,
  activePath,
  counts,
  collapsed = false,
  onNavigate,
}: NavListProps) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activePath === item.to;
        const count = item.badge ? counts?.[item.badge] : undefined;

        const link = (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center rounded-md text-sm font-medium transition-colors",
              collapsed ? "w-9 justify-center" : "gap-3 px-3",
              active
                ? "bg-primary-surface text-primary-text"
                : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-primary" : "text-ink-faint",
              )}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && count !== undefined && (
              <CountBadge count={count} className="ml-auto" />
            )}
            {collapsed && count !== undefined && count > 0 && (
              <span className="absolute translate-x-3 -translate-y-3 size-2 rounded-full bg-primary ring-2 ring-surface" />
            )}
          </NavLink>
        );

        if (!collapsed) return link;

        return (
          <Tooltip key={item.to} label={item.label} side="right">
            <div className="relative">{link}</div>
          </Tooltip>
        );
      })}
    </nav>
  );
}
