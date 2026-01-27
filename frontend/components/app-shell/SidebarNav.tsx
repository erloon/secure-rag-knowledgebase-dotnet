// components/app-shell/SidebarNav.tsx

"use client"

import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { SidebarNavItem } from "./SidebarNavItem"
import type { NavItem } from "@/types/sidebar"
import { getActiveNavItem } from "@/lib/navigation"

export interface SidebarNavProps {
  items: NavItem[]
}

/**
 * Sidebar navigation component
 * Renders navigation items from configuration
 * Handles active state detection based on current pathname
 */
export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()
  const activeItem = getActiveNavItem(pathname)

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={item.href === activeItem?.href}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
