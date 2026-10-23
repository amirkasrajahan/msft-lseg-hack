'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from './api';

const GREETING =
  "Hi! I'll help you work out where an ethical portfolio should invest. To start: who is the money for, and roughly how long can it stay invested?";

const STARTERS = [
  'A charity fund that has to last decades',
  "My own savings, I'd need them in about 5 years",
  'A pension pot for retirement in 25 years',
];

/** Interview chat. When the agent's finishIntake tool completes, the session has a profile: call onDone. */
export function IntakeStep({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/intake',
        prepareSendMessagesRequest: ({ id, messages }) => ({ body: { id, messages } }),
      }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({
    id: sessionId,
    transport,
    messages: [{ id: 'greeting', role: 'assistant', parts: [{ type: 'text', text: GREETING }] }],
  });
  const [input, setInput] = useState('');
  const end = useRef<HTMLDivElement>(null);

  const [saved, setSaved] = useState(false);

  // After each finished turn, check whether the agent saved the profile.
  useEffect(() => {
    if (status !== 'ready' || messages.length < 2 || saved) return;
    getSession(sessionId)
      .then((s) => {
        if (s.profile) {
          setSaved(true);
          onDone();
        }
      })
      .catch(() => undefined);
  }, [status, messages.length, saved, sessionId, onDone]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const busy = status === 'submitted' || status === 'streaming';
  const send = (text: string) => {
    if (!text.trim() || busy || saved) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <section>
      <h2>Tell us about your client</h2>
      <p className="muted">
        Answer a few questions. The assistant asks follow-ups about your goals, limits and ethical lines, then builds the profile.
      </p>
      <div className="chat card">
        <div className="chatlog" aria-live="polite">
          {messages.map((m) => {
            const text = m.parts.flatMap((p) => (p.type === 'text' ? [p.text] : [])).join('');
            if (!text) return null;
            return (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="bubble">
                  {text}
                </div>
              </div>
            );
          })}
          {status === 'submitted' && (
            <div className="msg assistant">
              <div className="bubble muted">Thinking…</div>
            </div>
          )}
          {messages.length === 1 && (
            <div className="chips starters">
              {STARTERS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={end} />
        </div>
        {error && (
          <div className="error" role="alert">
            {error.message}
          </div>
        )}
        <form
          className="chatform"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy || saved}
            placeholder={saved ? 'Profile saved' : 'Type your answer…'}
            aria-label="Your answer"
          />
          <button className="btn" disabled={busy || saved || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
