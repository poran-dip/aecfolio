import { ChevronsUpDown } from "lucide-react";
import { useRouteLoaderData } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import type { loader } from "~/routes/protected/route";
import { NAV_ITEMS, PLAN_LABELS } from "./nav-data";
import { NavMain } from "./nav-main";
import { UserMenu } from "./user-menu";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar();
  const data = useRouteLoaderData<typeof loader>("routes/protected/route");
  const user = data?.user;

  const navItems = user?.role ? (NAV_ITEMS[user.role] ?? []) : [];
  const plan = user?.role ? (PLAN_LABELS[user.role] ?? "") : "";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-state-open:bg-sidebar-accent data-state-open:text-sidebar-accent-foreground"
                >
                  <div className="relative flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">AEC Profiles</span>
                    <span className="truncate text-xs">{plan}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Applications
                </DropdownMenuLabel>
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="relative flex size-6 shrink-0 items-center justify-center rounded-sm border bg-white overflow-hidden p-0.5">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  AECFolio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <UserMenu
            name={user.name}
            email={user.email}
            image={user.image}
            role={user.role}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
