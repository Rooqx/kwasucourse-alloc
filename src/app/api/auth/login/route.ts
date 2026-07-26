import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

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

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        { error: { message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return Response.json(
        { error: { message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    // Check approval status (spec Section 5.2)
    if (!user.isApproved) {
      return Response.json(
        {
          error: {
            message:
              "Your account is pending admin approval. Please wait for an administrator to approve your registration.",
            code: "PENDING_APPROVAL",
          },
        },
        { status: 403 }
      );
    }

    // Sign JWT with userId, role, departmentId (spec Section 5.2)
    const token = signToken({
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    return Response.json({
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: { message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
