import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-primary" />
          <span className="text-lg font-semibold text-foreground">
            KWASU Course Allocation
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-600"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            Kwara State University — Department of Computer Science
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Smart Course Allocation System
          </h1>

          <p className="mb-8 text-lg text-muted-foreground">
            A preference-based, algorithmic allocation engine that replaces
            informal course assignment processes with transparent, fair, and
            reviewable allocations.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-600"
            >
              Login to Portal
              <ArrowRight />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-brand-50 text-primary">
              <GraduationCap />
            </div>
            <h3 className="mb-1 font-semibold text-foreground">
              Preference-Based
            </h3>
            <p className="text-sm text-muted-foreground">
              Lecturers submit ranked course preferences. The algorithm respects
              both lecturer preferences and course requirements.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-brand-50 text-primary">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-1 font-semibold text-foreground">
              HOD Reviewed
            </h3>
            <p className="text-sm text-muted-foreground">
              Every allocation passes through a draft → review → approve
              lifecycle. Nothing is auto-finalized without HOD oversight.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-brand-50 text-primary">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="mb-1 font-semibold text-foreground">
              Stable Matching
            </h3>
            <p className="text-sm text-muted-foreground">
              Powered by a capacity-aware Gale-Shapley algorithm ensuring fair,
              stable assignments with conflict detection.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} KWASU Course Allocation System. Department
        of Computer Science.
      </footer>
    </div>
  );
}
