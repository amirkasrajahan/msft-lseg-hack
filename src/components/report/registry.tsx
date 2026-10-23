import type { ComponentType } from 'react';
import type {
  ClientProfile,
  Portfolio,
  ReportComponentName,
  ReportSection,
  VetResult,
} from '@/lib/schemas';

/** Data every report component can read. Numbers come from here, never from props. */
export type ReportData = { profile: ClientProfile; vet: VetResult; portfolio: Portfolio };

export type ReportComponentProps<N extends ReportComponentName> = Extract<
  ReportSection,
  { component: N }
>['props'] &
  ReportData;

/** Frontend: replace each Placeholder with a real component. Typecheck enforces completeness. */
const Placeholder = ({ name }: { name: string }) => <section>TODO: {name}</section>;
const todo =
  <N extends ReportComponentName>(name: N): ComponentType<ReportComponentProps<N>> =>
  () => <Placeholder name={name} />;

export const reportRegistry: { [N in ReportComponentName]: ComponentType<ReportComponentProps<N>> } = {
  ExecutiveSummary: todo('ExecutiveSummary'),
  RiskProfileCard: todo('RiskProfileCard'),
  AllocationDonut: todo('AllocationDonut'),
  HoldingsTable: todo('HoldingsTable'),
  SectorBreakdown: todo('SectorBreakdown'),
  EthicalScreeningSummary: todo('EthicalScreeningSummary'),
  BorderlineDecisions: todo('BorderlineDecisions'),
  HoldingDeepDive: todo('HoldingDeepDive'),
  RiskFlags: todo('RiskFlags'),
};
