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

export function StartStep({ onStart }: { onStart: (personaId: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <section>
      <h2>Who are we investing for?</h2>
      <p className="muted">
        Pick a client to see how the assistant screens companies against their rules and causes, then
        builds a portfolio they can understand.
      </p>
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
      <div className="card soft" style={{ marginTop: '1rem' }}>
        <b>Describe your own client in chat</b>
        <p className="muted" style={{ margin: 0 }}>
          Coming soon. The chat intake isn&apos;t connected yet, so pick one of the clients above.
        </p>
      </div>
    </section>
  );
}
