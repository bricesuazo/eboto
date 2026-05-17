import { z } from 'zod';

// Years on credentials are stored as strings (the DB shape predates this
// refactor), but they must look like a 4-digit number in a sane range. We
// accept blank `endYear` on affiliations as a signal for "still affiliated"
// — that's the only place an empty year is meaningful.
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 10;

const yearString = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'Year must be 4 digits')
  .refine((s) => {
    const n = Number(s);
    return n >= MIN_YEAR && n <= MAX_YEAR;
  }, `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`);

const endYearString = z
  .string()
  .trim()
  .refine(
    (s) => s === '' || /^\d{4}$/.test(s),
    'Year must be 4 digits (or leave empty for ongoing)',
  )
  .refine((s) => {
    if (s === '') return true;
    const n = Number(s);
    return n >= MIN_YEAR && n <= MAX_YEAR;
  }, `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`);

export const candidateCredentialsSchema = z.object({
  platforms: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
  achievements: z.array(
    z.object({
      name: z.string(),
      year: yearString,
    }),
  ),
  affiliations: z
    .array(
      z.object({
        orgName: z.string(),
        orgPosition: z.string(),
        startYear: yearString,
        endYear: endYearString,
      }),
    )
    .superRefine((rows, ctx) => {
      // End-year must not precede start-year. We only check rows where both
      // are present so the "ongoing" case (blank endYear) passes through.
      rows.forEach((row, i) => {
        if (!row.endYear) return;
        if (Number(row.endYear) < Number(row.startYear)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, 'endYear'],
            message: 'End year must be the same as or after start year',
          });
        }
      });
    }),
  eventsAttended: z.array(
    z.object({
      name: z.string(),
      year: yearString,
    }),
  ),
});

export type CandidateCredentialsInput = z.infer<
  typeof candidateCredentialsSchema
>;

export { MIN_YEAR as CREDENTIAL_MIN_YEAR, MAX_YEAR as CREDENTIAL_MAX_YEAR };
