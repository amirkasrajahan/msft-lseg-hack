import { z } from 'zod';
import { clientProfileSchema } from './profile';
import { portfolioSchema } from './portfolio';
import { reportSpecSchema } from './report';
import { screenApprovalSchema, screenResultSchema } from './screen';
import { vetConfirmationSchema, vetResultSchema } from './vet';

/** The stage the session is waiting on / has reached. */
export const STAGES = ['intake', 'screen', 'vet', 'allocate', 'report', 'done'] as const;
export const stageSchema = z.enum(STAGES);

/** The single object the frontend polls/reads. Persisted in .data/sessions/{id}.json. */
export const sessionSchema = z.object({
  id: z.string(),
  stage: stageSchema,
  profile: clientProfileSchema.optional(),
  screen: screenResultSchema.optional(),
  screenApproval: screenApprovalSchema.optional(),
  vet: vetResultSchema.optional(),
  vetConfirmation: vetConfirmationSchema.optional(),
  portfolio: portfolioSchema.optional(),
  report: reportSpecSchema.optional(),
  error: z.string().optional(),
});

export type Stage = z.infer<typeof stageSchema>;
export type Session = z.infer<typeof sessionSchema>;
