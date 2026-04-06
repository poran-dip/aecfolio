"use client";
import {
  Briefcase,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

const data = {
  studentNav: [
    {
      title: "Academics",
      url: "/dashboard",
      icon: GraduationCap,
      isActive: true,
      items: [
        { title: "Dashboard", url: "/dashboard" },
        { title: "Results", url: "/dashboard/results" },
        { title: "Achievements", url: "/dashboard/achievements" },
      ],
    },
    {
      title: "Portfolio",
      url: "/dashboard/projects",
      icon: Briefcase,
      items: [
        { title: "Skills", url: "/dashboard/skills" },
        { title: "Projects", url: "/dashboard/projects" },
        { title: "Experience", url: "/dashboard/experience" },
      ],
    },
    {
      title: "Documents",
      url: "/dashboard/cv",
      icon: FileText,
      items: [{ title: "Generate CV", url: "/dashboard/cv" }],
    },
  ],
  facultyNav: [
    {
      title: "Students",
      url: "/dashboard",
      icon: GraduationCap,
      isActive: true,
      items: [{ title: "All Students", url: "/dashboard" }],
    },
    {
      title: "Verify",
      url: "/dashboard/verify",
      icon: Trophy,
      isActive: true,
      items: [
        { title: "Results", url: "/dashboard/verify/results" },
        { title: "Achievements", url: "/dashboard/verify/achievements" },
        { title: "Certifications", url: "/dashboard/verify/certifications" },
      ],
    },
    {
      title: "Administration",
      url: "/dashboard/faculty",
      icon: Briefcase,
      items: [
        { title: "Faculty", url: "/dashboard/faculty" },
        { title: "Pending Users", url: "/dashboard/pending" },
      ],
    },
    {
      title: "Account",
      url: "/dashboard/settings",
      icon: Settings,
      items: [{ title: "Edit Profile", url: "/dashboard/settings" }],
    },
  ],
};

interface AppSidebarProps {
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
  role?: "STUDENT" | "FACULTY" | "PENDING";
}

export function AppSidebar({
  userName,
  userEmail,
  userImage,
  role,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const activeTeam = {
    name: "AEC Profiles",
    logo: "/logo.png",
  };

  const navMain = React.useMemo(() => {
    if (role === "PENDING") return [];
    if (role === "FACULTY") return data.facultyNav;
    return data.studentNav;
  }, [role]);

  const plan =
    role === "FACULTY"
      ? "Faculty Portal"
      : role === "PENDING"
        ? "Pending Approval"
        : "Student Portal";

  // Global mock state sync for image
  const [localImage, setLocalImage] = React.useState(userImage);

  React.useEffect(() => {
    const handleUpdate = () => {
      const storedImage = localStorage.getItem("mockUserImage");
      if (storedImage) setLocalImage(storedImage);
    };
    handleUpdate();
    window.addEventListener("userImageUpdated", handleUpdate);
    return () => window.removeEventListener("userImageUpdated", handleUpdate);
  }, []);

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
                  <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 overflow-hidden">
                    <img
                      src={activeTeam.logo}
                      alt="Logo"
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {activeTeam.name}
                    </span>
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
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-sm border bg-white overflow-hidden p-0.5">
                    <img
                      src={activeTeam.logo}
                      alt="Logo"
                      className="size-full object-contain"
                    />
                  </div>
                  AEC Profiles
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-state-open/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isActive = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-state-open:bg-sidebar-accent data-state-open:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {localImage && (
                      <AvatarImage
                        src={localImage}
                        alt={userName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="rounded-lg">
                      {userName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userName}</span>
                    <span className="truncate text-xs">{userEmail}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      {localImage && (
                        <AvatarImage
                          src={localImage}
                          alt={userName}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="rounded-lg">
                        {userName?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userName}</span>
                      <span className="truncate text-xs">{userEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-950"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
