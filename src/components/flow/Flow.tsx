'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScreenApproval, Session, VetConfirmation } from '@/lib/schemas';
import { ProfileSummary } from './ProfileSummary';
import { ReportView } from './ReportView';
import { IntakeStep } from './IntakeStep';
import { ScreenStep } from './ScreenStep';
import { StartStep } from './StartStep';
import { VetStep } from './VetStep';
import { getSession, post } from './api';

const STORAGE_KEY = 'eia-session-id';
const STEPS = ['Client', 'Screen', 'Ethics check', 'Portfolio', 'Report'];

type Pending = 'screen' | 'vet' | 'allocate' | 'report' | null;

const WORKING_LABEL: Record<Exclude<Pending, null>, string> = {
  screen: 'Screening companies against your rules…',
  vet: 'Checking each company against your causes…',
  allocate: 'Building your portfolio…',
  report: 'Writing your report…',
};

/** The server call the session is waiting for, if the client has nothing left to decide. */
function pendingAction(s: Session | null): Pending {
  if (!s?.profile) return null;
  if (!s.screen) return 'screen';
  if (!s.screenApproval) return null;
  if (!s.vet) return 'vet';
  if (!s.vetConfirmation) return null;
  if (!s.portfolio) return 'allocate';
  if (!s.report) return 'report';
  return null;
}

function stepIndex(s: Session | null): number {
  if (!s?.profile) return 0;
  if (!s.screenApproval) return 1;
  if (!s.vetConfirmation) return 2;
  if (!s.report) return 3;
  return 4;
}

const remember = (id: string | null) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked: the flow still works, it just won't resume after a reload
  }
};

export function Flow() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [editing, setEditing] = useState(false);
  const inflight = useRef<string | null>(null);

  const run = useCallback(async (path: string, body?: unknown) => {
    setError(null);
    try {
      const next = await post(path, body);
      setSession(next);
      remember(next.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, []);

  // Resume the last session after a reload.
  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (!id) {
      setRestoring(false);
      return;
    }
    getSession(id)
      .then(setSession)
      .catch(() => remember(null))
      .finally(() => setRestoring(false));
  }, []);

  const pending = pendingAction(session);

  // Fire the next server stage automatically once the client has nothing left to decide.
  useEffect(() => {
    if (!session || !pending || error) return;
    const key = `${session.id}:${pending}`;
    if (inflight.current === key) return;
    inflight.current = key;
    run(`/api/session/${session.id}/${pending}`).finally(() => {
      inflight.current = null;
    });
  }, [session, pending, error, run]);

  const reload = useCallback(async () => {
    if (!session) return;
    try {
      setSession(await getSession(session.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, [session]);

  const finishEditing = async () => {
    await reload();
    setEditing(false);
  };

  const restart = () => {
    remember(null);
    setEditing(false);
    setSession(null);
    setError(null);
  };

  const approveScreen = (a: ScreenApproval) => run(`/api/session/${session!.id}/screen/approve`, a);
  const confirmVet = (c: VetConfirmation) => run(`/api/session/${session!.id}/vet/confirm`, c);

  const current = editing ? 0 : stepIndex(session);

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>Ethical Investment Assistant</h1>
          <small>Educational hackathon project. Not financial advice.</small>
        </div>
        {session && (
          <div className="actions" style={{ marginTop: 0 }}>
            {session.profile && !editing && !pending && (
              <button className="btn ghost" onClick={() => setEditing(true)}>
                Edit preferences
              </button>
            )}
            <button className="btn ghost" onClick={restart}>
              Start over
            </button>
          </div>
        )}
      </header>

      <ol className="stepper" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i < current ? 'done' : i === current ? 'current' : ''}
            aria-current={i === current ? 'step' : undefined}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <div className="error" role="alert">
          {error}
          <div className="actions">
            <button className="btn ghost" onClick={() => setError(null)}>
              Try again
            </button>
          </div>
        </div>
      )}

      {restoring ? (
        <Working label="Loading…" />
      ) : !session ? (
        <StartStep onStart={(personaId) => run('/api/session', personaId ? { personaId } : {})} />
      ) : (
        <>
          {session.profile && !editing && current < 4 && <ProfileSummary profile={session.profile} />}
          {!session.profile || editing ? (
            <IntakeStep
              sessionId={session.id}
              profile={editing ? session.profile : undefined}
              onDone={finishEditing}
              onCancel={editing ? () => setEditing(false) : undefined}
            />
          ) : pending ? (
            <Working label={WORKING_LABEL[pending]} />
          ) : session.report && session.vet && session.portfolio && session.profile ? (
            <ReportView
              report={session.report}
              data={{ profile: session.profile, vet: session.vet, portfolio: session.portfolio }}
            />
          ) : session.screen && !session.screenApproval ? (
            <ScreenStep screen={session.screen} onApprove={approveScreen} />
          ) : session.vet && !session.vetConfirmation ? (
            <VetStep vet={session.vet} onConfirm={confirmVet} />
          ) : null}
        </>
      )}
    </div>
  );
}

function Working({ label }: { label: string }) {
  return (
    <div className="working card" role="status">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
