// components/app-shell/SidebarNavItem.tsx

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import type { NavItem } from "@/types/sidebar"

export interface SidebarNavItemProps {
  item: NavItem
  isActive: boolean
}

/**
 * Individual sidebar navigation item
 * Renders a Next.js Link with icon, title, and optional badge
 * Handles active state styling and accessibility
 */
export function SidebarNavItem({ item, isActive }: SidebarNavItemProps) {
  const Icon = item.icon as LucideIcon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        disabled={item.disabled}
      >
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          aria-disabled={item.disabled ? "true" : undefined}
        >
          {Icon && <Icon />}
          <span>{item.title}</span>
          {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
