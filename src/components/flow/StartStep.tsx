'use client';

import { useState } from 'react';

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
  ['Tell us what matters', 'Chat about goals, risk and the ethical lines you will not cross.'],
  ['We screen and check', 'Companies are filtered on your rules, then checked against your causes. You approve each stage.'],
  ['Get a clear report', 'A portfolio with a plain-English reason for every holding, and for every exclusion.'],
];

export function StartStep({ onStart }: { onStart: (personaId?: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <section>
      <div className="hero">
        <h2>Invest in line with your values, and see exactly why.</h2>
        <p>
          An AI adviser interviews you, screens companies against your rules and causes, and builds a portfolio
          you can question at every step.
        </p>
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

      <button
        className="persona primary"
        style={{ width: '100%' }}
        disabled={picked !== null}
        onClick={() => {
          setPicked('chat');
          onStart();
        }}
      >
        <span className="badge keep">Recommended</span>
        <h3>Describe your own client in chat</h3>
        <p style={{ margin: 0 }}>
          The AI asks about your goals, limits and ethical lines, challenges grey areas, and builds the profile from
          your answers.
        </p>
      </button>

      <h3 style={{ margin: '1.5rem 0 .5rem' }}>Or try a ready-made client</h3>
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
