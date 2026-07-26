"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const departmentItems = useMemo(() => [
    { label: "Select department", value: null },
    ...departments.map((d) => ({ label: `${d.name} (${d.code})`, value: d.id }))
  ], [departments]);

  const levelItems = useMemo(() => [
    { label: "Select level", value: null },
    { label: "100 Level", value: "100" },
    { label: "200 Level", value: "200" },
    { label: "300 Level", value: "300" },
    { label: "400 Level", value: "400" },
  ], []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      role: "STUDENT",
    },
  });

  const selectedRole = watch("role");
  const departmentId = watch("departmentId");
  const level = watch("level");

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setDepartments(json.data);
      })
      .catch(() => {
        // Departments endpoint may not exist yet during dev
      });
  }, []);

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error?.fields) {
          // Field-level validation errors
          Object.values(json.error.fields).forEach((msg) => {
            toast.error(msg as string);
          });
        } else {
          toast.error(json.error?.message || "Registration failed");
        }
        return;
      }

      if (data.role === "LECTURER") {
        toast.success(
          "Registration successful! Your account is pending admin approval."
        );
      } else {
        toast.success("Registration successful! You can now log in.");
        router.push("/login");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <GraduationCap />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Create an account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register as a lecturer or student
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border border-border bg-card p-6"
        >
          <div className="flex flex-col gap-4">
            {/* Role toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium transition-colors",
                    selectedRole === "STUDENT"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-foreground hover:bg-secondary"
                  )}
                >
                  <input
                    type="radio"
                    value="STUDENT"
                    className="sr-only"
                    {...register("role")}
                  />
                  Student
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium transition-colors",
                    selectedRole === "LECTURER"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-foreground hover:bg-secondary"
                  )}
                >
                  <input
                    type="radio"
                    value="LECTURER"
                    className="sr-only"
                    {...register("role")}
                  />
                  Lecturer
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.fullName ? "border-destructive" : "border-input"
                )}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.email ? "border-destructive" : "border-input"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="departmentId" className="text-sm font-medium text-foreground">
                Department
              </label>
              <Select 
                items={departmentItems} 
                value={departmentId || null} 
                onValueChange={(v) => setValue("departmentId", v || "")}
              >
                <SelectTrigger id="departmentId" className={errors.departmentId ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={null}>Select department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-xs text-destructive">{errors.departmentId.message}</p>
              )}
            </div>

            {/* Student-only: Level */}
            {selectedRole === "STUDENT" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="level" className="text-sm font-medium text-foreground">
                  Level
                </label>
                <Select 
                  items={levelItems}
                  value={level ? level.toString() : null} 
                  onValueChange={(v) => setValue("level", v ? parseInt(v) : undefined as any)}
                >
                  <SelectTrigger id="level" className={errors.level ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={null}>Select level</SelectItem>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-xs text-destructive">{errors.level.message}</p>
                )}
              </div>
            )}

            {/* Lecturer-only fields */}
            {selectedRole === "LECTURER" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="specialization" className="text-sm font-medium text-foreground">
                    Specialization
                  </label>
                  <input
                    id="specialization"
                    type="text"
                    placeholder="e.g. Artificial Intelligence"
                    className={cn(
                      "rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                      errors.specialization ? "border-destructive" : "border-input"
                    )}
                    {...register("specialization")}
                  />
                  {errors.specialization && (
                    <p className="text-xs text-destructive">
                      {errors.specialization.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="seniorityRank" className="text-sm font-medium text-foreground">
                    Seniority Rank
                  </label>
                  <input
                    id="seniorityRank"
                    type="number"
                    min={1}
                    placeholder="1"
                    className={cn(
                      "rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                      errors.seniorityRank ? "border-destructive" : "border-input"
                    )}
                    {...register("seniorityRank")}
                  />
                  {errors.seniorityRank && (
                    <p className="text-xs text-destructive">
                      {errors.seniorityRank.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.password ? "border-destructive" : "border-input"
                )}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.confirmPassword ? "border-destructive" : "border-input"
                )}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        {/* Login link */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
