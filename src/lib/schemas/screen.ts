import { z } from 'zod';

export const screenBucketSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Why these companies are grouped, in client-facing language. */
  rationale: z.string(),
  action: z.enum(['keep', 'exclude']),
  tickers: z.array(z.string()),
});

/** Output of the stage 1 screen agent (b). */
export const screenResultSchema = z.object({
  buckets: z.array(screenBucketSchema),
  summary: z.string(),
});

/** What the client sends back when approving or adjusting the screen. */
export const screenApprovalSchema = z.object({
  /** Tickers the client moved into the kept set. */
  forceKeep: z.array(z.string()).default([]),
  /** Tickers the client moved into the excluded set. */
  forceExclude: z.array(z.string()).default([]),
});

export type ScreenBucket = z.infer<typeof screenBucketSchema>;
export type ScreenResult = z.infer<typeof screenResultSchema>;
export type ScreenApproval = z.infer<typeof screenApprovalSchema>;
