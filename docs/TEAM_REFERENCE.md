# Team Reference

Single source of truth for all three teammates **and their coding agents**. Read this first, then the
rule file for your module in `.cursor/rules/modules/`. If something here is wrong, fix it in a PR.

## 1. What we are building

An ethical investment assistant. Pipeline, with two human checkpoints:

1. **Intake** (agent a): chat with the client, producing a `ClientProfile` (risk 1-5, sectors, activity
   exclusions, causes with stance and weight).
2. **Stage 1 screen** (agent b): apply sector/activity rules to the company universe, group results into
   buckets. Client **approves or adjusts** (checkpoint 1).
3. **Stage 2 vet** (agent c): look up each remaining company in the pre-built **ethics cache** and apply a
   deterministic rubric against the client's causes. Output: passed, borderline (accepted), excluded.
   Client **confirms or flips** (checkpoint 2).
4. **Finance** (d): `allocate()` turns vetted companies + risk level into a `Portfolio`.
5. **Report** (agent e): composes an interactive report page from a fixed component registry.

```
profile -> screen -> [approve] -> vet -> [confirm] -> allocate -> report
```

MVP scope (do not expand): ~50-60 company universe, ethics cache built offline and frozen, nothing in the
demo path does live web research, no database. Time-boxed to 6 hours.

## 2. Who owns what

| Area | Owner | Paths |
|---|---|---|
| Frontend | Frontend | `app/**` (except `app/api/**`), `src/components/**` |
| Orchestration | Rayhan | `app/api/**`, `src/agents/**`, `src/pipeline/**`, `src/lib/**` (except schemas), `scripts/**`, `data/**` |
| Finance | Finance | `src/finance/**` |
| Contracts | Shared | `src/lib/schemas/**`, `fixtures/**`, `docs/**` |

Rules:
- Stay in your paths. Need a change elsewhere? Message the owner or open a small PR they review.
- **Schema changes** (`src/lib/schemas/**`): additive only after the 0:30 freeze. Post in the team chat
  before merging, update `docs/DATA_MODEL.md` and the matching fixture in the same PR.
- Never hardcode secrets. `.env` is gitignored; `.env.example` lists the variables.

## 3. Setup

```bash
npm install
cp .env.example .env     # then fill AZURE_OPENAI_API_KEY
npm run dev              # http://localhost:3000, USE_MOCKS=1 by default
```

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run typecheck` | `tsc --noEmit`. Must pass before merging |
| `npm run check:fixtures` | Validates every fixture/data JSON against the schemas. Must pass before merging |
| `npm run check:endpoint` | Smoke-tests Azure chat + embeddings (needs key) |
| `npm run build:cache` | Builds `data/ethics/*.json` (orchestration only) |

Python samples from the starter are in `legacy/` and are not used.

## 4. Contracts (types live in `src/lib/schemas/`, full field docs in `docs/DATA_MODEL.md`)

| Contract | Produced by | Consumed by |
|---|---|---|
| `ClientProfile` | intake | screen, vet, finance, report |
| `Company` (`data/universe.json`) | orchestration | screen, finance |
| `ScreenResult`, `ScreenApproval` | screen / UI | UI, vet |
| `EthicsRecord` (`data/ethics/{ticker}.json`) | `build:cache` | vet |
| `VetResult`, `VetConfirmation` | vet / UI | UI, finance, report |
| `AllocateInput` -> `Portfolio` | pipeline -> finance | report, UI |
| `ReportSpec` | report agent | UI (via registry) |
| `Session` | all | everyone; the one object the UI reads |

Always import types from `@/lib/schemas`. Always validate with the matching zod schema at boundaries
(LLM output, JSON files, request bodies).

## 5. HTTP API (frontend <-> orchestration)

All responses are JSON `Session` unless noted. Errors are `{ error: string }` with status 404 (no
session), 409 (earlier stage missing), 500, or 501 (not implemented).

| Method + path | Body | Effect |
|---|---|---|
| `POST /api/session` | `{ personaId? }` | Creates session. With a persona (`cautious-climate`, `aggressive-no-weapons`), profile is prefilled and stage is `screen` (skips intake) |
| `GET /api/session/:id` | | Current session |
| `POST /api/intake` | `{ id, messages }` | **Streaming** chat for `useChat`. 501 until the intake agent lands; use personas meanwhile |
| `POST /api/session/:id/screen` | | Runs stage 1 -> `session.screen` |
| `POST /api/session/:id/screen/approve` | `ScreenApproval` | Stores adjustments, stage -> `vet` |
| `POST /api/session/:id/vet` | | Runs stage 2 -> `session.vet` |
| `POST /api/session/:id/vet/confirm` | `VetConfirmation` | Stores adjustments, stage -> `allocate` |
| `POST /api/session/:id/allocate` | | Runs finance -> `session.portfolio`, stage -> `report` |
| `POST /api/session/:id/report` | | Runs report agent -> `session.report`, stage -> `done` |

Stages: `intake -> screen -> vet -> allocate -> report -> done` (`Session.stage`).

Frontend flow: create session -> `/screen` -> show buckets -> `/screen/approve` -> `/vet` -> show
excluded + borderline -> `/vet/confirm` -> `/allocate` -> `/report` -> render `session.report` with the
registry. Stage calls can take seconds in live mode: show progress, never block the UI silently.

## 6. Mock mode (how to work without waiting for anyone)

`USE_MOCKS=1` (default in `.env.example`): `src/pipeline/index.ts` returns files from `fixtures/` instead
of calling agents/finance. The session store and every route still run for real, so the full UI flow works
with zero credentials.

- Fixtures use **fictional** companies (`NRTH`, `SOLR`, `MINR`...) and are illustrative, not real claims.
- Frontend: build against mock mode first, then flip `USE_MOCKS=0` at integration.
- Finance: your `allocate()` can be developed standalone; feed it `fixtures/companies.json` and
  `data/personas/*.json`, validate with `portfolioSchema`.
- Only `src/pipeline/index.ts` knows about mocks. Agents and finance must never branch on `USE_MOCKS`.
- Adding a mock: put JSON in `fixtures/`, add it to `scripts/check-fixtures.ts`.

## 7. Module cheat sheets

**Frontend** (`app/`, `src/components/`)
- Report components are registered in `src/components/report/registry.tsx`. The registry type forces
  every `ReportComponentName` to be implemented. Props = narrative only; numbers come from `ReportData`
  (`profile`, `vet`, `portfolio`).
- Render `session.report.sections` by looking up `reportRegistry[section.component]`.
- New component: add a variant in `schemas/report.ts` + registry + `DATA_MODEL.md`, tell Orchestration.
- Responsive from desktop down to tablet; verify in Chrome and Safari. Charts must not rely on hover only.

**Orchestration** (`src/agents/`, `src/pipeline/`)
- Use `src/lib/llm.ts` only: `generateStructured({ schema, system, prompt })`, `chatModel()`,
  `embedTexts()`, `cosineSimilarity()`. The deployment is Azure **Chat Completions** (not Responses).
- Vercel AI SDK v7: structured output is `generateText({ output: Output.object({ schema }) })`;
  agents are `ToolLoopAgent`. Check `node_modules/ai/docs/` before guessing an API.
- Intake: `ToolLoopAgent` + `useChat`; map free-text causes to `CAUSES` ids via embeddings.
- Vet: **LLM never decides elimination.** Cache holds factors; `src/lib/rubric.ts` scores
  `severity x relativeScale x (confirmed ? 1 : 0.3) x (1 - remediation) x recencyDecay`, summed per cause,
  scaled by cause weight. Over threshold -> excluded; just under -> borderline. The LLM only writes the
  client-facing explanations.
- Report agent: output validated by `reportSpecSchema`; on failure fall back to a hardcoded default spec.

**Finance** (`src/finance/`)
- Contract: `allocate(input: AllocateInput): Promise<Portfolio>` in `src/finance/index.ts`.
- Weights sum to 1 (+/- 0.001), every holding has `financialReasons` and `ethicalReasons`. `flags` only
  when genuinely necessary. `metrics` is free-form numbers for charts.
- Use `profile.riskLevel` (1 cautious to 5 aggressive) for allocation. Use `VettedCompany.ethicalNotes` and
  `borderlineReason` to write `ethicalReasons`/`flags`.
- Check with organisers whether LSEG data is available; if so prefer it.
- Validate output with `portfolioSchema.parse()` before returning.

## 8. Git workflow

- Branches: `frontend/<topic>`, `orch/<topic>`, `finance/<topic>`. Small PRs, squash-merge, at least hourly.
- Before pushing: `npm run typecheck && npm run check:fixtures`.
- No force-pushes to `main`. Do not commit `.env`, `.data/`, `node_modules/`.
- Do not add co-author trailers to commits.
- Pull `main` before starting each new chunk of work to pick up schema changes.

## 9. Docs hygiene (required after each working session)

- `CONTEXT.md`: update module status and active focus.
- Schema changed: update `docs/DATA_MODEL.md` and the fixture.
- Architecture decision: append to `docs/DECISIONS.md`.
- Module API surface changed: update `.cursor/rules/modules/<name>.mdc`.

## 10. Coding conventions

- TypeScript strict, no `any`. Zod at every boundary. Types inferred from schemas, not hand-written twins.
- Small, modular files; no dead code, no speculative abstractions. Ask or look up docs when unsure of a
  structure instead of guessing.
- Do not modify code outside the task you were given. Do not widen scope.
- Use `@/` imports for `src/`.

## 11. Timeline checkpoints (6h)

| Time | Milestone |
|---|---|
| 0:30 | Scaffold + contracts frozen (done) |
| 2:00 | Finance returns a valid `Portfolio` from fixtures; UI flows in mock mode; cache build running |
| 3:30 | Mocks off, end-to-end run |
| 4:30 | Report agent + polish |
| 5:15 | Feature freeze, rehearse with both personas |

Cut order if behind: report agent (use fixture-style default spec), borderline-flip UI, second persona.
