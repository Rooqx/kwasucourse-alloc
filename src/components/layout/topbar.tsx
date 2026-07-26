"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Bell } from "lucide-react";
import Link from "next/link";

export function Topbar() {
  const { user } = useAuth();

  if (!user) return null;

  const notificationHref =
    user.role === "LECTURER" ? "/lecturer/notifications" : "#";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {getRoleLabel(user.role)} Portal
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {user.role === "LECTURER" && (
          <Link
            href={notificationHref}
            className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bell />
          </Link>
        )}
        <div className="text-sm text-muted-foreground">
          {user.fullName}
        </div>
      </div>
    </header>
  );
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "HOD":
      return "Head of Department";
    case "LECTURER":
      return "Lecturer";
    case "STUDENT":
      return "Student";
    default:
      return role;
  }
}
