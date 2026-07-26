import { z } from 'zod';

export const lecturerSchema = z.object({
  maxUnits: z.coerce.number().min(1).max(30),
  specialization: z.string().min(2),
  seniorityLevel: z.coerce.number().min(1).max(10),
  isSabbatical: z.boolean(),
  departmentId: z.string().min(1),
});

export type LecturerFormData = z.infer<typeof lecturerSchema>;
