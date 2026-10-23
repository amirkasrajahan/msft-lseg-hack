'use client';

import { useState } from 'react';
import { PERSONAS } from './personas';

/** Chooser shown at /app when there is no session: chat with Ethos, or try a ready-made client. */
export function StartStep({ onStart }: { onStart: (personaId?: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <section>
      <h2>Who are we investing for?</h2>
      <p className="muted">
        Tell Ethos about your organisation in a short chat, or try one of the ready-made clients to see the full flow.
      </p>

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
          Ethos asks about your goals, limits and ethical lines, challenges grey areas, and builds the profile from your
          answers.
        </p>
      </button>

      <h3 style={{ margin: '1.5rem 0 .5rem' }}>Or start from a ready-made client</h3>
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
