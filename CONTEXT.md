# Context

Ethical investment assistant (hackathon, 6h). Start with `docs/TEAM_REFERENCE.md`.

## Active focus

Scaffold and contracts are done. Next: each owner builds their module against mocks (`USE_MOCKS=1`).

## Module status

| Module | Owner | Status | Notes |
|---|---|---|---|
| Schemas / contracts (`src/lib/schemas`) | Shared | Done, frozen (additive only) | Validated by `npm run check:fixtures` |
| LLM helpers (`src/lib/llm.ts`) | Orchestration | Chat + structured output verified against the portal | Function tools and `/responses` do not work on this deployment (DECISIONS 9). Embeddings still unverified |
| Session store + API routes | Orchestration | Done, smoke-tested in mock mode | Full flow works with fixtures |
| Intake agent | Orchestration | Working draft (added by Frontend, please review) | `src/agents/intake.ts` + `/api/intake`: AI interview via structured output, one turn per request, saves `session.profile` when the client confirms. No function tools (see `docs/DECISIONS.md` 9). Verified against the live portal |
| Screen agent | Orchestration | Stub | `src/agents/screen.ts` |
| Vet agent + rubric | Orchestration | Stub | `src/agents/vet.ts`, rubric not written |
| Cache builder + `data/universe.json` | Orchestration | Not started | `scripts/build-cache.ts` is a stub; universe not created |
| Report agent | Orchestration | Stub | `src/agents/report.ts` |
| Finance `allocate()` | Finance | Stub | `src/finance/index.ts` |
| Frontend pages | Frontend | Done in mock mode | Single-page flow in `src/components/flow/`: persona start, screen approval, vet confirmation, report. Chat intake step in `IntakeStep.tsx` (`useChat`). Resumes the last session from localStorage |
| Report component registry | Frontend | Done | All nine components in `src/components/report/sections.tsx`, wired in `registry.tsx` |

## Open items

- Frontend gap: stage 1 and 2 results carry tickers only, so those screens show tickers without company names. Orchestration: expose names (e.g. a `companies` map on `Session` or `GET /api/companies`).
- `.env.example` is missing from the repo (docs say to copy it). Mock mode needs `USE_MOCKS=1` in `.env`.
- `.gitignore` does not ignore `node_modules/`, `.next/`, `.data/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`.
- Confirm embeddings (`text-embedding-3-large`) work on the portal. Endpoint and chat deployment (`gpt-6.1-sol`) are confirmed.
- Confirm LSEG data availability with organisers (Finance).
- Choose news source for the cache (Google News RSS / GDELT, or a search API if provided).
