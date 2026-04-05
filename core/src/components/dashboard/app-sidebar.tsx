import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/Sidebar"

type User = {
  name: string
  email: string
  image: string | null
  role: "STUDENT" | "FACULTY" | "ADMIN"
}

export function AppSidebar({ user }: { user: User }) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-border">
        <p className="text-sm font-semibold">{user.name}</p>
        <p className="text-xs text-foreground/70">{user.email}</p>
        <p className="text-xs text-foreground/70 capitalize">{user.role.toLowerCase()}</p>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter />
    </Sidebar>
  )
}
