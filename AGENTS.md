# Agent instructions

Read `docs/TEAM_REFERENCE.md` before changing anything, then the rule for your module in
`.cursor/rules/modules/`. Contracts are in `src/lib/schemas/`; do not change them without following the
schema-change process in the reference doc.

Before finishing: `npm run typecheck && npm run check:fixtures`, then update `CONTEXT.md` (and
`docs/DATA_MODEL.md`, `docs/DECISIONS.md`, module rules if affected). Do not add co-author trailers to
commits. Only change what the task asks for.
