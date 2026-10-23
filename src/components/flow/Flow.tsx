'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Company, ScreenApproval, Session, VetConfirmation } from '@/lib/schemas';
import { IntakeStep } from './IntakeStep';
import { ProfileSummary } from './ProfileSummary';
import { ReportView } from './ReportView';
import { ScreenStep } from './ScreenStep';
import { StartStep } from './StartStep';
import { VetStep } from './VetStep';
import { getSession, post } from './api';

const STORAGE_KEY = 'eia-session-id';
// The portfolio is built and the report written with no client decision in between, so they share one step.
const STEPS = ['Client', 'Screen', 'Ethics check', 'Your report'];
/** Steps the client makes decisions in, so the only ones they can go back to. */
const REVISITABLE = 2;

type Pending = 'screen' | 'vet' | 'allocate' | 'report' | null;

const WORKING: Record<Exclude<Pending, null>, [string, string]> = {
  screen: ['Screening companies against your rules…', 'Applying your sector and activity rules and grouping what is left.'],
  vet: ['Checking each company against your causes…', "Reading each company's record on the causes you care about and scoring it."],
  allocate: ['Building your portfolio…', 'Weighing risk and return across the companies that passed.'],
  report: ['Writing your report…', 'Turning the numbers into a plain-English explanation.'],
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

/** How far the session has actually got (0 to 3), whatever step is on screen. */
function progress(s: Session | null): number {
  if (!s?.profile) return 0;
  if (!s.screenApproval) return 1;
  if (!s.vetConfirmation) return 2;
  return 3;
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
  /** A step the client went back to. Null means show wherever the session has got to. */
  const [revisit, setRevisit] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
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

  // Company names and details for the screen and vet steps. Without them the steps show tickers only.
  useEffect(() => {
    fetch('/api/companies')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Company[]) => setCompanies(Object.fromEntries(list.map((c) => [c.ticker, c]))))
      .catch(() => undefined);
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
    setRevisit(null);
  };

  const restart = () => {
    remember(null);
    setRevisit(null);
    setSession(null);
    setError(null);
  };

  const approveScreen = async (a: ScreenApproval) => {
    setRevisit(null);
    await run(`/api/session/${session!.id}/screen/approve`, a);
  };
  const confirmVet = async (c: VetConfirmation) => {
    setRevisit(null);
    await run(`/api/session/${session!.id}/vet/confirm`, c);
  };

  const reached = progress(session);
  const current = revisit ?? reached;
  const canGoBack = (i: number) => !!session?.profile && !pending && i <= REVISITABLE && i < reached && i !== revisit;

  const body = () => {
    if (!session) return null;
    if (!session.profile || revisit === 0) {
      return (
        <IntakeStep
          sessionId={session.id}
          profile={revisit === 0 ? session.profile : undefined}
          onDone={finishEditing}
          onCancel={revisit === 0 ? () => setRevisit(null) : undefined}
        />
      );
    }
    if (pending) return <Working label={WORKING[pending][0]} detail={WORKING[pending][1]} />;
    if (revisit === 1 && session.screen) {
      return (
        <ScreenStep
          screen={session.screen}
          profile={session.profile}
          companies={companies}
          initial={session.screenApproval}
          onApprove={approveScreen}
          onCancel={() => setRevisit(null)}
        />
      );
    }
    if (revisit === 2 && session.vet) {
      return (
        <VetStep
          vet={session.vet}
          companies={companies}
          initial={session.vetConfirmation}
          onConfirm={confirmVet}
          onCancel={() => setRevisit(null)}
        />
      );
    }
    if (session.report && session.vet && session.portfolio) {
      return (
        <ReportView
          report={session.report}
          data={{ profile: session.profile, vet: session.vet, portfolio: session.portfolio }}
          screen={session.screen}
          screenApproval={session.screenApproval}
          vetConfirmation={session.vetConfirmation}
          companies={companies}
        />
      );
    }
    if (session.screen && !session.screenApproval) {
      return <ScreenStep screen={session.screen} profile={session.profile} companies={companies} onApprove={approveScreen} />;
    }
    if (session.vet && !session.vetConfirmation) {
      return <VetStep vet={session.vet} companies={companies} onConfirm={confirmVet} />;
    }
    return null;
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="18" fill="var(--brand)" />
            <path d="M11 24c0-8 5-12 14-12 0 8-4 13-12 13l-2 3" fill="none" stroke="var(--on-brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h1>Ethical Investment Assistant</h1>
            <small>Educational hackathon project. Not financial advice.</small>
          </div>
        </div>
        {session && (
          <div className="actions" style={{ marginTop: 0 }}>
            {session.profile && !pending && revisit !== 0 && (
              <button className="btn ghost" onClick={() => setRevisit(0)}>
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
            {canGoBack(i) ? (
              <button onClick={() => setRevisit(i)} title={`Go back to ${label.toLowerCase()}`}>
                {i + 1}. {label}
              </button>
            ) : (
              <>
                {i + 1}. {label}
              </>
            )}
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
          {session.profile && revisit !== 0 && !(session.report && revisit === null) && <ProfileSummary profile={session.profile} />}
          {body()}
        </>
      )}
    </div>
  );
}

function Working({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className="working card" role="status">
      <div className="spinner" />
      <p style={{ marginBottom: detail ? '.25rem' : undefined }}>
        <b>{label}</b>
      </p>
      {detail && <p className="muted">{detail}</p>}
    </div>
  );
}
