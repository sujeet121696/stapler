# Stapler

> A browser-only PDF workspace that an AI agent drives through WebMCP tools. Every
> operation runs client-side, so files never leave the tab.

**Stack:** React 19 · Vite · TypeScript · pdf-lib · pdf.js · no backend

## Docs

| Doc | Read it for |
|---|---|
| [PRD](docs/PRD.md) | What the product is, who it's for, what's out of scope |
| [Architecture](docs/ARCHITECTURE.md) | Stack, modules, data flow, testing, deploy |
| [Rules](docs/RULES.md) | Workflow, invariants, tool and code conventions |
| [Design](docs/DESIGN.md) | UI layout, visual style, UX principles |
| [Tasks](docs/TASKS.md) | What's done, what's next, known limitations |
| [Archive](docs/archive/README.md) | Hackathon-era notes (historical, not maintained) |

## Commands

```bash
npm run dev      # http://localhost:5173 (Chrome needs chrome://flags/#enable-webmcp-testing)
npm run build    # type-check + production build → dist/
npm run lint     # oxlint
npm run smoke    # verify sample data (salary credits on statement pages 4-7 only)
```

## Top rules

1. **Never commit, push or deploy unless asked.** The owner commits manually.
2. Documents never leave the browser: no uploads, no backend, no persistence.
3. Every document change goes through `src/ops.ts` so it's logged and undoable.
4. Update `docs/` when behavior or tasks change.
