# Context

Ethical investment assistant (hackathon, 6h). Start with `docs/TEAM_REFERENCE.md`.

## Active focus

Scaffold and contracts are done. Next: each owner builds their module against mocks (`USE_MOCKS=1`).

## Module status

| Module | Owner | Status | Notes |
|---|---|---|---|
| Schemas / contracts (`src/lib/schemas`) | Shared | Done, frozen (additive only) | Validated by `npm run check:fixtures` |
| LLM helpers (`src/lib/llm.ts`) | Orchestration | Written, **untested against Azure** | `.env` key was empty at scaffold time; run `npm run check:endpoint` |
| Session store + API routes | Orchestration | Done, smoke-tested in mock mode | Full flow works with fixtures |
| Intake agent | Orchestration | Not started | `/api/intake` returns 501; use personas |
| Screen agent | Orchestration | Stub | `src/agents/screen.ts` |
| Vet agent + rubric | Orchestration | Stub | `src/agents/vet.ts`, rubric not written |
| Cache builder + `data/universe.json` | Orchestration | Not started | `scripts/build-cache.ts` is a stub; universe not created |
| Report agent | Orchestration | Stub | `src/agents/report.ts` |
| Finance `allocate()` | Finance | Stub | `src/finance/index.ts` |
| Frontend pages | Frontend | Placeholder | `app/page.tsx` |
| Report component registry | Frontend | Placeholders | `src/components/report/registry.tsx` |

## Open items

- Azure key not yet in `.env`; confirm endpoint, chat deployment (`gpt-6.1-sol`) and embeddings work.
- Confirm LSEG data availability with organisers (Finance).
- Choose news source for the cache (Google News RSS / GDELT, or a search API if provided).
