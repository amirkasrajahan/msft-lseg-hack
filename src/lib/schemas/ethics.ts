import { z } from 'zod';
import { causeIdSchema } from './causes';

/** One ethical incident, as extracted offline by scripts/build-cache.ts. */
export const incidentSchema = z.object({
  year: z.number().int(),
  summary: z.string(),
  /** 1 = minor, 5 = catastrophic. */
  severity: z.number().int().min(1).max(5),
  /** Scale relative to the company's size. 1 = negligible, 5 = existential. */
  relativeScale: z.number().int().min(1).max(5),
  /** false = allegation or unproven. */
  confirmed: z.boolean(),
  /** 0 = ignored/covered up, 1 = fully remediated and reformed. */
  remediation: z.number().min(0).max(1),
  sourceUrls: z.array(z.string()),
});

export const causeEvidenceSchema = z.object({
  incidents: z.array(incidentSchema),
  positives: z.array(z.string()),
});

/** One file of data/ethics/{ticker}.json (the cache read by the vet agent). */
export const ethicsRecordSchema = z.object({
  ticker: z.string(),
  generatedAt: z.string(),
  causes: z.partialRecord(causeIdSchema, causeEvidenceSchema),
  sources: z.array(z.string()),
});

export type Incident = z.infer<typeof incidentSchema>;
export type CauseEvidence = z.infer<typeof causeEvidenceSchema>;
export type EthicsRecord = z.infer<typeof ethicsRecordSchema>;
