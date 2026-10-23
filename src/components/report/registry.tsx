import type { ComponentType } from 'react';
import type {
  ClientProfile,
  Portfolio,
  ReportComponentName,
  ReportSection,
  VetResult,
} from '@/lib/schemas';
import {
  AllocationDonut,
  BorderlineDecisions,
  EthicalScreeningSummary,
  ExecutiveSummary,
  HoldingDeepDive,
  HoldingsTable,
  RiskFlags,
  RiskProfileCard,
  SectorBreakdown,
} from './sections';

/** Data every report component can read. Numbers come from here, never from props. */
export type ReportData = { profile: ClientProfile; vet: VetResult; portfolio: Portfolio };

export type ReportComponentProps<N extends ReportComponentName> = Extract<
  ReportSection,
  { component: N }
>['props'] &
  ReportData;

export const reportRegistry: { [N in ReportComponentName]: ComponentType<ReportComponentProps<N>> } = {
  ExecutiveSummary,
  RiskProfileCard,
  AllocationDonut,
  HoldingsTable,
  SectorBreakdown,
  EthicalScreeningSummary,
  BorderlineDecisions,
  HoldingDeepDive,
  RiskFlags,
};
