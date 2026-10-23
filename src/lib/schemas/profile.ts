import { z } from 'zod';
import { causeIdSchema } from './causes';
import { activityTagSchema, sectorSchema } from './company';

export const clientCauseSchema = z.object({
  causeId: causeIdSchema,
  /**
   * Both stances exclude companies with serious incidents in this cause.
   * 'seek' additionally rewards positive evidence (used for ethicalReasons and tie-breaks).
   */
  stance: z.enum(['seek', 'avoid']),
  /** 1 = nice to have, 3 = important, 5 = non-negotiable. Scales vetting strictness. */
  weight: z.number().int().min(1).max(5),
  /** The user's own words, kept for explanations in the report. */
  userWords: z.string().optional(),
});

/** Output of the intake agent (a). Input to screen, vet, finance and report. */
export const clientProfileSchema = z.object({
  /** 1 = very cautious ... 5 = very aggressive. Drives allocation in finance. */
  riskLevel: z.number().int().min(1).max(5),
  sectors: z.object({
    include: z.array(sectorSchema),
    exclude: z.array(sectorSchema),
  }),
  /** Industries/activities the client refuses outright (stage 1 hard exclusion). */
  activityExclusions: z.array(activityTagSchema),
  causes: z.array(clientCauseSchema),
  notes: z.string().optional(),
});

export type ClientCause = z.infer<typeof clientCauseSchema>;
export type ClientProfile = z.infer<typeof clientProfileSchema>;
