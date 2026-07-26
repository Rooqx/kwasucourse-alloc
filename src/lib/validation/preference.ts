import { z } from 'zod';

export const preferenceSchema = z.object({
  preferences: z.array(
    z.object({
      courseId: z.string().min(1),
      rank: z.coerce.number().int().min(1),
    })
  ).min(1, 'Submit at least one preference'),
});

export type PreferenceInput = z.infer<typeof preferenceSchema>;
