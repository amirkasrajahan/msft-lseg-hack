import Link from 'next/link';
import { ResumeLink } from '@/components/ResumeLink';
import { PERSONAS } from '@/components/flow/personas';
import { CAUSES } from '@/lib/schemas/causes';
import { cacheStats } from '@/pipeline/stats';

const HOW = [
  ['Describe your organisation', 'A short conversation about your goals, how long the money can stay invested, and the lines you will not cross.'],
  ['Check the screen and the evidence', 'Companies are filtered on your rules, then rated on your causes from dated, cited incidents. You approve each stage.'],
  ['Read a report you can defend', 'A portfolio with a reason for every holding and for every company left out, and the sources behind each.'],
];

const FOR = [
  ['Charities and foundations', 'They spend a share of their funds every year and cannot afford to break their own values.'],
  ['Law firms and professional bodies', 'They hold money under strict duties and need a record of why each holding was chosen.'],
  ['Other ethical institutions', 'Trusts, universities and funds that answer to members or the public.'],
];

export default async function Landing() {
  const stats = await cacheStats();

  return (
    <main className="lp">
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div>
            <h1 className="lp-title">
              Invest with purpose.
              <br />
              Grow with confidence.
            </h1>
            <p className="lp-sub">
              Ethos helps charities and institutions choose investments that match their values, and shows the evidence
              behind every decision.
            </p>
            <div className="lp-cta">
              <Link href="/app?start=chat" className="lp-btn">
                Get started
              </Link>
              <a href="#clients" className="lp-link">
                Try a demo client
              </a>
            </div>
            <p className="lp-aud">Ethos works best for ethical charities and ethical institutions, such as law firms.</p>
            <ResumeLink />
          </div>

          <figure className="lp-ev" aria-label="Illustration of an evidence card, using a fictional company">
            <div className="lp-ev-card">
              <div className="lp-ev-top">
                <b>Northfield Mining plc</b>
                <span className="lp-ev-tag">Close call</span>
              </div>
              <p className="lp-ev-meta">Climate and emissions · 71% of the exclusion line</p>
              <p className="lp-ev-fact">2023 · Confirmed · severity 4 of 5 · 60% remedied</p>
              <blockquote>Scope 1 and 2 emissions among the highest in its sector.</blockquote>
              <p className="lp-ev-src">Source: Annual sustainability report, with a link to read it</p>
              <div className="lp-ev-actions" aria-hidden="true">
                <span>Exclude this</span>
              </div>
            </div>
            <figcaption>Every close call and exclusion opens to its evidence like this. Illustration with a fictional company.</figcaption>
          </figure>
        </div>
      </section>

      {stats && (
        <section className="lp-facts" aria-label="What Ethos covers today">
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
            <b>{CAUSES.length}</b>
            <span>causes you can weigh</span>
          </div>
        </section>
      )}

      <section id="how" className="lp-sec">
        <h2>How it works</h2>
        <ol className="lp-cols">
          {HOW.map(([title, text], i) => (
            <li key={title}>
              <span className="lp-no">{String(i + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="built-for" className="lp-sec">
        <h2>Who it is for</h2>
        <ul className="lp-cols">
          {FOR.map(([title, text]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="clients" className="lp-sec">
        <h2>Try a demo client</h2>
        <p className="lp-lead">Each one runs the whole flow, from the screen to the report.</p>
        <div className="lp-rows">
          {PERSONAS.map((p) => (
            <Link key={p.id} href={`/app?persona=${p.id}`} className="lp-row">
              <div>
                <h3>{p.title}</h3>
                <p>{p.blurb}</p>
              </div>
              <span>Run this client</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="lp-end">
        <h2>Describe your organisation and see what Ethos recommends.</h2>
        <Link href="/app?start=chat" className="lp-btn dark">
          Get started
        </Link>
      </section>

      <footer className="lp-footer">
        <b>Ethos</b>
        <p>
          An educational hackathon prototype. Ethical assessments use a growing evidence base and portfolio weights are a
          placeholder. Not financial advice.
        </p>
      </footer>
    </main>
  );
}
