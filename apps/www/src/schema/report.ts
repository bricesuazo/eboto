import { z } from 'zod/v4';

export const ReportAProblemSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  election_id: z.uuid('Election is required').optional(),
});
export type ReportAProblem = z.infer<typeof ReportAProblemSchema>;
