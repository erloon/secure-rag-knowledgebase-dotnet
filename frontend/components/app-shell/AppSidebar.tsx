// components/app-shell/AppSidebar.tsx

"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarHeader } from "./SidebarHeader"
import { SidebarNav } from "./SidebarNav"
import { SidebarFooter } from "./SidebarFooter"
import { mainNavItems } from "@/lib/navigation"

export interface AppSidebarProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

/**
 * Main application sidebar component
 * Composes all sidebar sections (header, content, footer)
 * Wraps shadcn/ui Sidebar with application navigation
 */
export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <SidebarNav items={mainNavItems} />
      </SidebarContent>
      <SidebarFooter user={user} />
      <SidebarRail />
    </Sidebar>
  )
}
