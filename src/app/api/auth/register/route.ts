import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validation/auth";
import { Role } from '@/generated/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      return Response.json(
        { error: { message: "Validation failed", fields: fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Only LECTURER and STUDENT can self-register (spec Section 5.1)
    if (!["LECTURER", "STUDENT"].includes(data.role)) {
      return Response.json(
        { error: { message: "Only Lecturer and Student roles can self-register" } },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return Response.json(
        { error: { message: "Email already registered" } },
        { status: 409 }
      );
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      return Response.json(
        { error: { message: "Department not found" } },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    // Students are auto-approved; lecturers require admin approval (spec Section 5.1)
    const isApproved = data.role === "STUDENT";

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        role: data.role as Role,
        departmentId: data.departmentId,
        isApproved,
        level: data.role === "STUDENT" ? data.level : null,
      },
    });

    // Create LecturerProfile if role is LECTURER
    if (data.role === "LECTURER" && data.specialization) {
      await prisma.lecturerProfile.create({
        data: {
          userId: user.id,
          specialization: data.specialization,
          seniorityRank: data.seniorityRank || 1,
        },
      });
    }

    return Response.json(
      {
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { error: { message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
