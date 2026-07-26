import { z } from 'zod';

export const courseSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(10),
  title: z.string().min(3, "Title must be at least 3 characters"),
  units: z.coerce.number().min(1, "Units must be at least 1").max(6),
  level: z.coerce.number().min(100).max(500),
  semester: z.enum(['FIRST', 'SECOND']),
  departmentId: z.string().min(1, "Department is required"),
  specializationTag: z.string().optional().nullable(),
  capacity: z.coerce.number().min(1).optional().nullable(),
  timeSlot: z.string().optional().nullable(),
});

export type CourseFormData = z.infer<typeof courseSchema>;
