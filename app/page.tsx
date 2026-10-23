import Link from 'next/link';
import { ResumeLink } from '@/components/ResumeLink';
import { EthosMark } from '@/components/flow/EthosMark';
import { PERSONAS } from '@/components/flow/personas';
import { cacheStats } from '@/pipeline/stats';

const HOW = [
  ['Tell Ethos what matters', 'A short chat about your goals, your time horizon and the ethical lines you will not cross.'],
  ['Ethos screens and checks', 'Companies are filtered on your rules, then rated on your causes from cited evidence. You approve every stage.'],
  ['Get a report you can defend', 'A portfolio with a plain-English reason for every holding, and for every company left out.'],
];

const BUILT_FOR = [
  ['Charities and foundations', 'Spend a share of their funds every year and cannot afford to break their own values.'],
  ['Law firms and professional bodies', 'Hold money under strict duties and need a record of why each holding was chosen.'],
  ['Other ethical institutions', 'Trusts, universities and funds that answer to members or the public.'],
];

/** Static sample of the report, for the preview card only. */
const SAMPLE_SPLIT = [
  ['Consumer Staples', 28, '#7aa2ff'],
  ['Health Care', 22, '#3cc4ae'],
  ['Financials', 20, '#f0b84a'],
  ['Utilities', 18, '#b19cf0'],
  ['Industrials', 12, '#ef7b77'],
] as const;

function Donut() {
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="lp-donut" aria-hidden="true">
      <g transform="rotate(-90 70 70)">
        {SAMPLE_SPLIT.map(([name, pct, colour], i) => {
          const dash = (pct / 100) * C;
          const el = (
            <circle
              key={name}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={colour}
              strokeWidth="18"
              strokeDasharray={`${dash - 2} ${C}`}
              strokeDashoffset={-offset}
              className="seg"
              style={{ animationDelay: `${0.4 + i * 0.12}s` }}
            />
          );
          offset += dash;
          return el;
        })}
      </g>
      <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">
        14
      </text>
      <text x="70" y="86" textAnchor="middle" fontSize="9" fill="#9fb2dd">
        holdings
      </text>
    </svg>
  );
}

export default async function Landing() {
  const stats = await cacheStats();

  return (
    <main className="lp">
      <section className="lp-hero">
        <div className="lp-stars" aria-hidden="true" />
        <div className="lp-glow" aria-hidden="true" />
        <div className="lp-hero-inner">
          <span className="lp-badge">
            <i /> AI-powered ethical investing
          </span>
          <h1 className="lp-title">
            Invest with <span className="lp-gold">purpose.</span>
            <br />
            Grow with <span className="lp-gold">confidence.</span>
          </h1>
          <p className="lp-sub">
            Ethos interviews your organisation, screens real companies against your values, and shows the evidence behind
            every decision.
          </p>
          <div className="lp-cta">
            <Link href="/app?start=chat" className="lp-btn primary">
              Get started
            </Link>
            <a href="#clients" className="lp-btn glass">
              Try a demo client
            </a>
          </div>
          <p className="lp-audience">Ethos works best for ethical charities and ethical institutions, such as law firms.</p>
          <ResumeLink />
        </div>

        <div className="lp-preview" role="img" aria-label="Example Ethos report: how 332 companies became a 14-company portfolio">
          <div className="lp-window">
            <div className="lp-window-bar">
              <i />
              <i />
              <i />
              <span>Example report</span>
            </div>
            <div className="lp-window-body">
              <div className="lp-pane">
                <h4>How we got here</h4>
                <div className="lp-stages">
                  {[
                    ['332', 'Companies considered'],
                    ['105', 'Passed your rules'],
                    ['41', 'Passed the ethics check'],
                    ['14', 'In your portfolio'],
                  ].map(([n, label], i) => (
                    <div key={label} className={`lp-stage${i === 3 ? ' last' : ''}`}>
                      <b>{n}</b>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="lp-evidence">
                  <span className="lp-pill warn">Close call</span>
                  <p>Every close call shows the dated incident, the source&apos;s own words and a link to read it.</p>
                  <small>Dated incident · verbatim quote · source link</small>
                </div>
              </div>
              <div className="lp-pane">
                <h4>Where the money goes</h4>
                <div className="lp-split">
                  <Donut />
                  <ul>
                    {SAMPLE_SPLIT.map(([name, pct, colour]) => (
                      <li key={name}>
                        <i style={{ background: colour }} />
                        {name}
                        <b>{pct}%</b>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <section className="lp-stats" aria-label="What Ethos covers today">
          <div>
            <b>{stats.companies}</b>
            <span>UK-listed companies screened</span>
          </div>
          <div>
            <b>{stats.researched}</b>
            <span>with a researched evidence record</span>
          </div>
          <div>
            <b>{stats.sources.toLocaleString('en-GB')}</b>
            <span>cited sources behind the ratings</span>
          </div>
          <div>
            <b>15</b>
            <span>causes you can weigh</span>
          </div>
        </section>
      )}

      <section id="how" className="lp-section">
        <p className="lp-eyebrow">How it works</p>
        <h2>From values to a portfolio you can defend</h2>
        <ol className="lp-cards three">
          {HOW.map(([title, text], i) => (
            <li key={title}>
              <span className="lp-num">{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="built-for" className="lp-section">
        <p className="lp-eyebrow">Who it&apos;s for</p>
        <h2>Built for institutions that have to explain where their money goes</h2>
        <ul className="lp-cards three">
          {BUILT_FOR.map(([title, text]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="clients" className="lp-section">
        <p className="lp-eyebrow">Try it now</p>
        <h2>Start from a ready-made client</h2>
        <div className="lp-cards two">
          {PERSONAS.map((p) => (
            <Link key={p.id} href={`/app?persona=${p.id}`} className="lp-persona">
              <h3>{p.title}</h3>
              <p>{p.blurb}</p>
              <div className="lp-tags">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <span className="lp-link">Run this client →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="lp-final">
        <h2>
          Invest with <span className="lp-gold">purpose.</span> Grow with <span className="lp-gold">confidence.</span>
        </h2>
        <div className="lp-cta">
          <Link href="/app?start=chat" className="lp-btn primary">
            Get started
          </Link>
          <Link href="/about" className="lp-btn glass">
            About Ethos
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div>
          <EthosMark size={28} boxed={false} />
          <b>Ethos</b>
        </div>
        <p>
          An educational hackathon prototype. Ethical assessments use a growing evidence base and portfolio weights are a
          placeholder. Not financial advice.
        </p>
      </footer>
    </main>
  );
}
