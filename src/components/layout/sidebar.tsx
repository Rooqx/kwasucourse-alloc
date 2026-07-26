"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  Calendar,
  Settings,
  ClipboardList,
  BarChart3,
  FileText,
  History,
  Bell,
  User,
  GraduationCap,
  Heart,
  Flag,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Lecturers", href: "/admin/lecturers", icon: Users },
    { label: "Sessions", href: "/admin/sessions", icon: Calendar },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "Audit Log", href: "/admin/audit-log", icon: ClipboardList },
  ],
  HOD: [
    { label: "Dashboard", href: "/hod/dashboard", icon: LayoutDashboard },
    { label: "Run Allocation", href: "/hod/allocation/run", icon: Settings },
    { label: "Review Draft", href: "/hod/allocation/review", icon: ClipboardList },
    { label: "History", href: "/hod/allocation/history", icon: History },
    { label: "Reports", href: "/hod/reports", icon: FileText },
    { label: "Analytics", href: "/hod/analytics", icon: BarChart3 },
  ],
  LECTURER: [
    { label: "Dashboard", href: "/lecturer/dashboard", icon: LayoutDashboard },
    { label: "Preferences", href: "/lecturer/preferences", icon: Heart },
    { label: "Allocations", href: "/lecturer/allocations", icon: BookOpen },
    { label: "Notifications", href: "/lecturer/notifications", icon: Bell },
    { label: "Profile", href: "/lecturer/profile", icon: User },
  ],
  STUDENT: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Browse Courses", href: "/student/courses", icon: BookOpen },
    { label: "Register", href: "/student/register", icon: GraduationCap },
    { label: "My Courses", href: "/student/my-courses", icon: ClipboardList },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const items = navItems[user.role] || [];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <GraduationCap className="text-primary" />
        <div>
          <h1 className="text-sm font-semibold text-foreground">KWASU</h1>
          <p className="text-xs text-muted-foreground">Course Allocation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("shrink-0", isActive ? "" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {user.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
