// components/app-shell/SidebarFooter.tsx

import { SidebarFooter as ShadcnSidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { User } from "lucide-react"

export interface SidebarFooterProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  className?: string
}

/**
 * Sidebar footer component
 * Displays user profile information
 */
export function SidebarFooter({ user, className }: SidebarFooterProps) {
  const defaultUser = {
    name: "Demo User",
    email: "demo@example.com",
  }

  const currentUser = user || defaultUser

  return (
    <ShadcnSidebarFooter className={className}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <div>
              <User className="size-4" />
              <div className="flex flex-col gap-0.5 text-left leading-none">
                <span className="text-sm font-semibold">{currentUser.name}</span>
                <span className="text-xs">{currentUser.email}</span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </ShadcnSidebarFooter>
  )
}
