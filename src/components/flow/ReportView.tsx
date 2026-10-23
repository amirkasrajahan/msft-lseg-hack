import type { ReactElement } from 'react';
import type { ReportData } from '@/components/report/registry';
import { reportRegistry } from '@/components/report/registry';
import type { ReportSection, ReportSpec } from '@/lib/schemas';

/** Renders the report agent's sections through the component registry. */
export function ReportView({ report, data }: { report: ReportSpec; data: ReportData }) {
  return (
    <section>
      <h2 className="report-title">{report.title}</h2>
      {report.sections.map((s, i) => (
        <div key={i} className="report-section">
          {renderSection(s, data)}
        </div>
      ))}
    </section>
  );
}

function renderSection(s: ReportSection, data: ReportData): ReactElement {
  // The registry is keyed by component name; TS can't correlate the pair, so narrow per case.
  switch (s.component) {
    case 'ExecutiveSummary': return <reportRegistry.ExecutiveSummary {...s.props} {...data} />;
    case 'RiskProfileCard': return <reportRegistry.RiskProfileCard {...s.props} {...data} />;
    case 'AllocationDonut': return <reportRegistry.AllocationDonut {...s.props} {...data} />;
    case 'HoldingsTable': return <reportRegistry.HoldingsTable {...s.props} {...data} />;
    case 'SectorBreakdown': return <reportRegistry.SectorBreakdown {...s.props} {...data} />;
    case 'EthicalScreeningSummary': return <reportRegistry.EthicalScreeningSummary {...s.props} {...data} />;
    case 'BorderlineDecisions': return <reportRegistry.BorderlineDecisions {...s.props} {...data} />;
    case 'HoldingDeepDive': return <reportRegistry.HoldingDeepDive {...s.props} {...data} />;
    case 'RiskFlags': return <reportRegistry.RiskFlags {...s.props} {...data} />;
  }
}
