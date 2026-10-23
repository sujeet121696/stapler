# Rules

> How to work in this repo. Follow these unless the owner says otherwise.

## 1. Workflow

- **Never commit, push or deploy unless explicitly asked.** The owner commits manually.
- After code changes, run `npm run build` and `npm run lint`.
- After touching `samples.ts`, `pdf.ts` or `ops.ts`, also run `npm run smoke`.
- Deploy only with the recipe in [ARCHITECTURE.md § Deploy](ARCHITECTURE.md#5-deploy).
- Keep `docs/` current. Update [TASKS.md](TASKS.md) as work progresses.

## 2. Product invariants

- **Privacy first.** No network calls carrying user data, no backend, and document bytes are never persisted.
- **One path for changes.** Every mutation goes through `ops.ts` → `store.mutateDocs`, so it's logged and undoable.
- **Shared operations.** The UI and the agent use the same functions. Don't add agent-only or UI-only logic.

## 3. WebMCP tools

- `execute` returns a plain string. Report failures as `"Error: ..."` text; don't throw to the agent.
- Keep schemas narrow: `additionalProperties: false`, document params as enums of loaded names, page ranges checked against the real page count.
- Write descriptions for the agent: when to use the tool and what it returns. Retest with a real agent after changing one.
- Mark read-only tools with `annotations: { readOnlyHint: true }`.
- Keep re-registration deferred and signature-gated (see `webmcp.ts`).

## 4. Code style

- TypeScript strict. No unused locals or params. Avoid `any`.
- Match the existing format: no semicolons, single quotes, 2-space indent, small named exports.
- Comments explain *why* (browser quirks, spec behavior), not *what*.
- Keep dependencies minimal. Discuss before adding a runtime dependency.
- Sample and test data must stay fictional. Never commit real personal documents.
