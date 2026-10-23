import type { ReactElement } from 'react';
import type { ReportData } from '@/components/report/registry';
import { reportRegistry } from '@/components/report/registry';
import type { Company, ReportSection, ReportSpec, ScreenApproval, ScreenResult, VetConfirmation } from '@/lib/schemas';
import { DecisionTrail } from './DecisionTrail';
import { HorizonOptions } from './HorizonOptions';

/** Open every <details> so the printed or saved page keeps all the detail, then put them back. */
function printAll() {
  const all = [...document.querySelectorAll<HTMLDetailsElement>('.rp details')];
  const was = all.map((d) => d.open);
  all.forEach((d) => (d.open = true));
  window.addEventListener('afterprint', () => all.forEach((d, i) => (d.open = was[i])), { once: true });
  window.print();
}

/** Renders the report agent's sections through the component registry, plus the client's decision trail. */
export function ReportView({
  sessionId,
  report,
  data,
  screen,
  screenApproval,
  vetConfirmation,
  companies,
}: {
  sessionId: string;
  report: ReportSpec;
  data: Omit<ReportData, 'companies'>;
  screen?: ScreenResult;
  screenApproval?: ScreenApproval;
  vetConfirmation?: VetConfirmation;
  companies: Record<string, Company>;
}) {
  const full: ReportData = { ...data, companies };
  const empty = data.portfolio.holdings.length === 0;

  // The summary leads, the trail follows it, and the donut and sector bars sit side by side.
  const parts: ReactElement[] = [];
  const sections = empty ? [] : report.sections;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const next = sections[i + 1];
    if (s.component === 'AllocationDonut' && next?.component === 'SectorBreakdown') {
      parts.push(
        <div key={i} className="rp-two">
          {renderSection(s, full)}
          {renderSection(next, full)}
        </div>,
      );
      i++;
    } else parts.push(<div key={i}>{renderSection(s, full)}</div>);
    if (s.component === 'ExecutiveSummary' && screen) {
      parts.push(
        <DecisionTrail
          key="trail"
          screen={screen}
          screenApproval={screenApproval}
          vet={data.vet}
          vetConfirmation={vetConfirmation}
          held={data.portfolio.holdings.map((h) => h.ticker)}
          companies={companies}
        />,
      );
    }
  }

  return (
    <article className="rp">
      <header className="rp-head">
        <h1 className="rp-kicker">{report.title}</h1>
        <button className="btn ghost small no-print" onClick={printAll}>
          Print or save as PDF
        </button>
      </header>
      {empty && (
        <div className="rp-empty" role="alert">
          <h3>No companies are left to invest in</h3>
          <p>
            Your rules and the ethics check removed every company. Go back with the steps above, relax a rule or include a
            company anyway, and the report will rebuild.
          </p>
        </div>
      )}
      {parts}
      {/* The three horizons sit inside the report, not on a page of their own:
          the comparison is the point, and it belongs where the client is
          already reading their portfolio. Hidden when nothing was allocated. */}
      {!empty && <HorizonOptions sessionId={sessionId} />}
    </article>
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
