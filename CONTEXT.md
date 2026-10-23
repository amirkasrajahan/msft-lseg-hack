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
| Vet agent + rubric | Orchestration | Rubric written (`src/lib/rubric.ts`), real vet runs in `REAL_DATA=1` | `src/agents/vet.ts` still a stub; `realVet` in `src/pipeline/real.ts` does the work |
| Cache builder + `data/universe.json` | Orchestration | In progress (`orch/cache`) | 332 companies, 110 evidence records so far |
| Report agent | Orchestration | Stub | `src/agents/report.ts` |
| Finance `allocate()` | Finance | Done | Mean-variance under a volatility budget set by `riskLevel`, long only, 10% per company, cash synthesised so short horizons are reachable. Reads the frozen `data/market.json` |
| Market data | Finance | Done | `scripts/fetch-market.py` builds `data/market.json` from Yahoo: 97 FTSE 100 companies, 3y of daily closes. Offline only |
| Three horizons | Finance | Done | `POST /api/session/:id/options` + `HorizonOptions.tsx`, shown inside the report |
| Frontend pages | Frontend | Done in mock mode | Landing page at `/`, the advisor at `/app` (`/app?start=chat` and `/app?persona=ID` start straight away). Single-page flow in `src/components/flow/`: persona start, screen approval, vet confirmation, report. Chat intake step in `IntakeStep.tsx` (`useChat`). Earlier steps are clickable in the stepper; company chips show a hover card with name, details and why they are in or out. Resumes the last session from localStorage |
| Report component registry | Frontend | Done | All nine components in `src/components/report/sections.tsx`, wired in `registry.tsx` |

## Real-data mode (`REAL_DATA=1`, added by Frontend, please review)

`src/pipeline/real.ts` runs the pipeline on `data/universe.json` and `data/ethics/` instead of fixtures. Set it in `.env`.
- **Real:** stage 1 screen (rules on sector and activity tags) and stage 2 vet (`src/lib/rubric.ts` on cited evidence). `npm run check:rubric` asserts the rubric.
- **`realAllocate` is superseded.** `REAL_FINANCE=1` routes real-data mode through `allocate()` instead; without the flag nothing changes. Once the team is happy, drop the flag and delete `realAllocate` from `src/pipeline/real.ts`.
- Expected returns are shrunk 80% toward the cross-sectional mean and re-centred on the risk-free rate plus a 4.5% equity premium. A three-year sample mean is not a forecast: raw, it claims 42% a year for Rolls-Royce. Say so when presenting.
- Only FTSE 100 is priced. Eligible companies outside it are named in the portfolio's methodology, never silently dropped. `python3 scripts/fetch-market.py --index all` covers all 332.
- **Not rated:** a company with no cache record, or coverage `partial` or `none`, goes in `VetResult.unrated`. It is never treated as clean and is left out unless the client includes it.
- **Schemas** were extended additively to read the new data (`sources` with quotes, `coverage`, `customer_practices`, `tier`, `index`, `VetResult.unrated`). Rayhan: if your own schema changes differ, yours win; tell me and I will adapt.
- **Rubric constants** (`RUBRIC` in `rubric.ts`): exclude at 8, borderline at 4, 12-year half-life; per cause the worst incident counts in full and the rest at half; a confirmed severity 4 or 5 incident keeps a cause at least a close call (client weight 3 or more). Cause weight scales the score (3 is neutral). See `docs/DECISIONS.md` 11. The UI shows the score as a share of the exclusion line. Tune freely.
- **Coverage today:** 110 of 332 companies have records (all FTSE 100, 10 FTSE 250, 2 SmallCap). Fair wages and supply chain have evidence for only 27 companies, so clients who care mainly about those rarely get exclusions.

## Open items

- Opt-in demo rules (`USE_MOCKS=1 DEMO_RULES=1`, `src/pipeline/demo.ts`): makes the mock screen, vet, portfolio and report react to the client's profile. Not the real logic and makes no forecasts. Off by default; delete the file and its five hooks in `src/pipeline/index.ts` when the real stages land. Orchestration: please review the hooks.
- Company logos: `CompanyLogo.tsx` asks logo.dev for a logo by ticker when `NEXT_PUBLIC_LOGO_DEV_TOKEN` is set, and falls back to initials otherwise. Tickers are London symbols and logo.dev matches symbols globally, so check the logos shown for wrong companies. Orchestration: an optional `domain` on `Company` would be a safer key.
- Frontend added `GET /api/companies` (universe via `loadUniverse()`), and `/screen/approve` and `/vet/confirm` now clear downstream results so the client can go back to an earlier step. Orchestration: please review.
- `.env.example` now exists (added by Frontend); copy it to `.env`. It documents `USE_MOCKS`, `REAL_DATA`, `DEMO_RULES`, the Azure key and the logo.dev token.
- `.gitignore` does not ignore `node_modules/`, `.next/`, `.data/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`.
- Confirm embeddings (`text-embedding-3-large`) work on the portal. Endpoint and chat deployment (`gpt-6.1-sol`) are confirmed.
- Confirm LSEG data availability with organisers (Finance). Yahoo is in place meanwhile.
- The footer still says portfolio weights are a placeholder. They are not, once `REAL_FINANCE=1`.
- Azure embeddings are confirmed working (`text-embedding-3-large`, 3072 dimensions).
- Choose news source for the cache (Google News RSS / GDELT, or a search API if provided).
