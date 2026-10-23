import { z } from 'zod';

/**
 * The report agent (e) outputs an ordered list of sections. Props contain
 * NARRATIVE and layout choices only. Numeric data (weights, metrics) is read by
 * each component from the Portfolio / VetResult / Profile, never from props.
 *
 * To add a component: add a variant here, add it to the registry in
 * src/components/report/registry.tsx, note it in docs/DATA_MODEL.md.
 */
export const reportSectionSchema = z.discriminatedUnion('component', [
  z.object({
    component: z.literal('ExecutiveSummary'),
    props: z.object({ headline: z.string(), narrative: z.string() }),
  }),
  z.object({
    component: z.literal('RiskProfileCard'),
    props: z.object({ narrative: z.string() }),
  }),
  z.object({
    component: z.literal('AllocationDonut'),
    props: z.object({ title: z.string() }),
  }),
  z.object({
    component: z.literal('HoldingsTable'),
    props: z.object({ title: z.string(), showReasons: z.boolean() }),
  }),
  z.object({
    component: z.literal('SectorBreakdown'),
    props: z.object({ title: z.string() }),
  }),
  z.object({
    component: z.literal('EthicalScreeningSummary'),
    props: z.object({ narrative: z.string() }),
  }),
  z.object({
    component: z.literal('BorderlineDecisions'),
    props: z.object({ narrative: z.string() }),
  }),
  z.object({
    component: z.literal('HoldingDeepDive'),
    props: z.object({ ticker: z.string(), narrative: z.string() }),
  }),
  z.object({
    component: z.literal('RiskFlags'),
    props: z.object({ narrative: z.string() }),
  }),
]);

export const reportSpecSchema = z.object({
  title: z.string(),
  sections: z.array(reportSectionSchema),
});

export type ReportSection = z.infer<typeof reportSectionSchema>;
export type ReportComponentName = ReportSection['component'];
export type ReportSpec = z.infer<typeof reportSpecSchema>;
