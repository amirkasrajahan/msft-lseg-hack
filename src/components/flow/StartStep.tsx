'use client';

import { useState } from 'react';
import { EthosMark } from './EthosMark';

// ponytail: personas are hardcoded, there is no list endpoint. Add one if more personas appear.
const PERSONAS = [
  {
    id: 'cautious-climate',
    title: 'Cautious climate saver',
    blurb:
      'Retired teacher focused on capital preservation and income. Refuses fossil fuels and tobacco, and wants their money to help the net-zero transition.',
    tags: ['Risk 2 of 5', 'No fossil fuels', 'Climate first'],
  },
  {
    id: 'aggressive-no-weapons',
    title: 'Growth-seeking engineer',
    blurb:
      '30-year-old with a long horizon who wants maximum growth. Refuses weapons and gambling, and cares about fair wages and forced labour in supply chains.',
    tags: ['Risk 5 of 5', 'No weapons', 'Fair wages'],
  },
];

const HOW = [
  ['Tell Ethos what matters', 'Chat about goals, risk and the ethical lines you will not cross.'],
  ['Ethos screens and checks', 'Companies are filtered on your rules, then checked against your causes. You approve each stage.'],
  ['Get a clear report', 'A portfolio with a plain-English reason for every holding, and for every exclusion.'],
];

const BUILT_FOR = [
  ['Charities and foundations', 'Spend a share of their funds every year and cannot afford to break their own values.'],
  ['Law firms and professional bodies', 'Hold money under strict duties and need a record of why each holding was chosen.'],
  ['Other ethical institutions', 'Trusts, universities and funds that answer to members or the public.'],
];

export function StartStep({ onStart }: { onStart: (personaId?: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const startChat = () => {
    setPicked('chat');
    onStart();
  };

  return (
    <section className="landing">
      <div className="hero-band">
        <span className="orb o1" />
        <span className="orb o2" />
        <span className="orb o3" />
        <div className="hero-inner">
          <div className="wordmark">
            <EthosMark size={40} fill="#fff" stroke="#12305f" />
            Ethos
          </div>
          <h2 className="motto">
            Invest with purpose.
            <br />
            <span>Grow with confidence.</span>
          </h2>
          <p>
            Ethos is an AI adviser that interviews you, screens companies against your values, and shows its reasoning at
            every step.
          </p>
          <div className="cta-row">
            <button className="btn gold" onClick={startChat} disabled={picked !== null}>
              Start with Ethos
            </button>
            <a className="btn outline" href="#clients">
              Try a ready-made client
            </a>
          </div>
          <p className="audience">Ethos works best for ethical charities and ethical institutions, such as law firms.</p>
        </div>
      </div>

      <ol className="how">
        {HOW.map(([title, text], i) => (
          <li key={title}>
            <span className="num">{i + 1}</span>
            <b>{title}</b>
            <span className="muted">{text}</span>
          </li>
        ))}
      </ol>

      <h3 className="section-title">Built for institutions that have to explain where their money goes</h3>
      <div className="grid3">
        {BUILT_FOR.map(([title, text]) => (
          <div key={title} className="card built">
            <b>{title}</b>
            <p className="muted" style={{ margin: 0 }}>
              {text}
            </p>
          </div>
        ))}
      </div>

      <h3 id="clients" className="section-title">
        Or try a ready-made client
      </h3>
      <div className="grid2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            className="persona"
            disabled={picked !== null}
            onClick={() => {
              setPicked(p.id);
              onStart(p.id);
            }}
          >
            <h3>{p.title}</h3>
            <p>{p.blurb}</p>
            <div className="chips">
              {p.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
