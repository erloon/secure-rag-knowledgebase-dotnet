// components/app-shell/SidebarHeader.tsx

import { SidebarSeparator, SidebarHeader as ShadcnSidebarHeader, SidebarMenuButton } from "@/components/ui/sidebar"
import Link from "next/link"

export interface SidebarHeaderProps {
  className?: string
}

/**
 * Sidebar header component
 * Displays application logo/brand and collapse button
 */
export function SidebarHeader({ className }: SidebarHeaderProps) {
  return (
    <ShadcnSidebarHeader className={className}>
      <div className="flex items-center gap-2 px-2 py-2">
        <SidebarMenuButton size="lg" asChild>
          <Link href="/">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-lg font-bold">Kb</span>
            </div>
            <div className="flex flex-col gap-0.5 text-left leading-none">
              <span className="text-sm font-semibold">KbRag</span>
              <span className="text-xs">Knowledge Base</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </div>
      <SidebarSeparator />
    </ShadcnSidebarHeader>
  )
}
