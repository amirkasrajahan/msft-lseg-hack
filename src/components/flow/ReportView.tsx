import type { ReactElement } from 'react';
import type { ReportData } from '@/components/report/registry';
import { reportRegistry } from '@/components/report/registry';
import type { Company, ReportSection, ReportSpec, ScreenApproval, ScreenResult, VetConfirmation } from '@/lib/schemas';
import { DecisionTrail } from './DecisionTrail';

/** Renders the report agent's sections through the component registry, plus the client's decision trail. */
export function ReportView({
  report,
  data,
  screen,
  screenApproval,
  vetConfirmation,
  companies,
}: {
  report: ReportSpec;
  data: ReportData;
  screen?: ScreenResult;
  screenApproval?: ScreenApproval;
  vetConfirmation?: VetConfirmation;
  companies: Record<string, Company>;
}) {
  return (
    <section>
      <div className="report-head">
        <h2 className="report-title">{report.title}</h2>
        <button className="btn ghost no-print" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      {data.portfolio.holdings.length === 0 && (
        <div className="card warn-card" role="alert">
          <h3>No companies are left to invest in</h3>
          <p style={{ margin: 0 }}>
            Your rules and the ethics check removed every company. Go back with the steps above, relax a rule or
            include a company anyway, and the report will rebuild.
          </p>
        </div>
      )}
      {screen && (
        <div className="report-section">
          <DecisionTrail
            screen={screen}
            screenApproval={screenApproval}
            vet={data.vet}
            vetConfirmation={vetConfirmation}
            held={data.portfolio.holdings.map((h) => h.ticker)}
            companies={companies}
          />
        </div>
      )}
      {data.portfolio.holdings.length > 0 &&
        report.sections.map((s, i) => (
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
