import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
    role: z.enum(["LECTURER", "STUDENT"]),
    departmentId: z.string().min(1, "Department is required"),
    // Lecturer-only fields
    specialization: z.string().optional(),
    seniorityRank: z.coerce.number().int().min(1).optional(),
    // Student-only field
    level: z.coerce.number().int().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "LECTURER") {
        return !!data.specialization && data.specialization.length > 0;
      }
      return true;
    },
    {
      message: "Specialization is required for lecturers",
      path: ["specialization"],
    }
  )
  .refine(
    (data) => {
      if (data.role === "STUDENT") {
        return data.level !== undefined && [100, 200, 300, 400].includes(data.level);
      }
      return true;
    },
    {
      message: "Level is required for students (100, 200, 300, or 400)",
      path: ["level"],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;
