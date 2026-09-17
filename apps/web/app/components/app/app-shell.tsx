import type { User } from "@aecfolio/shared";
import { Menu, PanelLeft } from "lucide-react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useMatches } from "react-router";
import { Logo } from "~/components/brand/logo";
import { IconButton } from "~/components/ui/icon-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "~/components/ui/sheet";
import { Toaster } from "~/components/ui/toast";
import { activeNavPath, homeFor, navItemsFor } from "~/lib/nav";
import { cn } from "~/lib/utils";
import { type NavCounts, NavList } from "./nav-list";
import { UserMenu } from "./user-menu";

const COLLAPSE_COOKIE = "sidebar_collapsed";

function usePageTitle(): string | null {
  const matches = useMatches();

  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i].handle as { title?: string } | undefined;
    if (handle?.title) return handle.title;
  }

  return null;
}

function persistCollapsed(collapsed: boolean) {
  // biome-ignore lint/suspicious/noDocumentCookie: CookieStore is not in Safari or Firefox yet
  document.cookie = `${COLLAPSE_COOKIE}=${collapsed ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
}

type AppShellProps = {
  user: User;
  defaultCollapsed?: boolean;
  counts?: NavCounts;
  children: ReactNode;
};

export function AppShell({
  user,
  defaultCollapsed = false,
  counts,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const items = navItemsFor(user.role);
  const activePath = activeNavPath(pathname, items);
  const home = homeFor(user.role);
  const title = usePageTitle();

  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const close = () => {
      if (query.matches) setMobileOpen(false);
    };
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, []);

  function toggleCollapsed() {
    setCollapsed((previous) => {
      persistCollapsed(!previous);
      return !previous;
    });
  }

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <div className="min-h-svh bg-background">
        {/* Desktop sidebar — full height, the top bar starts where it ends */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <div
            className={cn(
              "flex h-14 shrink-0 items-center",
              collapsed ? "justify-center" : "px-4",
            )}
          >
            <Logo to={home} markOnly={collapsed} />
          </div>

          <div
            className={cn(
              "flex-1 overflow-y-auto py-2",
              collapsed ? "px-3.5" : "px-3",
            )}
          >
            <NavList
              items={items}
              activePath={activePath}
              counts={counts}
              collapsed={collapsed}
            />
          </div>

          <div
            className={cn(
              "shrink-0 border-t border-line p-2",
              collapsed && "flex justify-center",
            )}
          >
            <UserMenu user={user} collapsed={collapsed} />
          </div>
        </aside>

        {/* Mobile navigation */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="lg:hidden"
            overlayClassName="lg:hidden"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Links to every section you can open.
            </SheetDescription>
            <div className="flex h-14 shrink-0 items-center px-4">
              <Logo to={home} />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <NavList
                items={items}
                activePath={activePath}
                counts={counts}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
            <div className="shrink-0 border-t border-line p-2">
              <UserMenu user={user} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Top bar and content shift together with the sidebar */}
        <div
          className={cn(
            "flex min-h-svh flex-col transition-[padding] duration-200",
            collapsed ? "lg:pl-16" : "lg:pl-60",
          )}
        >
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur-md sm:px-4">
            <IconButton
              label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
            >
              <Menu />
            </IconButton>
            <IconButton
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
              className="hidden lg:inline-flex"
            >
              <PanelLeft />
            </IconButton>
            {title && (
              <h1 className="truncate font-heading text-base font-semibold text-ink">
                {title}
              </h1>
            )}
          </header>

          <main className="flex-1">{children}</main>
        </div>

        <Toaster />
      </div>
    </TooltipPrimitive.Provider>
  );
}
