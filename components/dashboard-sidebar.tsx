"use client"

import { useAuth } from "@/lib/auth-context"
import { NissanLogo } from "@/components/nissan-logo"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
  ChevronRight,
  Cloud,
  HardDrive,
} from "lucide-react"

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function DashboardSidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "configurations", label: "Configurations", icon: FileText },
    ...(user?.role === "approver" || user?.role === "admin"
      ? [{ id: "approvals", label: "Approvals", icon: CheckSquare }]
      : []),
    { id: "master-data", label: "Master Data", icon: Cloud },
    { id: "file-storage", label: "File Storage", icon: HardDrive },
  ]

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <NissanLogo className="h-8 w-auto text-sidebar-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  currentView === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {currentView === item.id && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
