# Architecture

> How Stapler is built: stack, modules, data flow, testing and deploy.

## 1. Stack

| Concern | Choice |
|---|---|
| UI | React 19 + Vite 8 |
| Language | TypeScript 6, strict, `noUnusedLocals` / `noUnusedParameters` |
| Write PDFs (extract, merge) | `pdf-lib` |
| Read PDFs (page count, text) | `pdfjs-dist` |
| WebMCP typings | `webmcp-types` |
| Lint / scripts | oxlint / tsx |
| Hosting | Cloudflare Pages, static, no backend |

## 2. Data flow

```
agent (ChatGPT in-app browser / Chrome + Tool Inspector)
   │  WebMCP tool calls
   ▼
webmcp.ts ──┐
            ├──► ops.ts ──► pdf.ts (pdf.js) / pdf-lib
App.tsx ────┘       │
   ▲                ▼
   └──────────── store.ts (docs, op log, undo stack)
```

The agent and the UI call the same functions in `ops.ts`. Nothing else touches PDF bytes.

## 3. Modules (`src/`)

| File | Responsibility |
|---|---|
| `store.ts` | In-memory state (`docs`, `opLog`), `useStapler` hook, undo stack |
| `ops.ts` | Document operations: find, inspect, extract, merge, rename, export, undo |
| `pdf.ts` | pdf.js helpers: `readPdf`, `extractPageTexts` |
| `webmcp.ts` | Registers the tools and keeps their schemas in sync with the store |
| `samples.ts` | Generates the fictional visa sample PDFs in the browser |
| `App.tsx` | UI: drop zone, sample button, doc cards, op log, preview modal |

### Key details

- **Store.** A module-level store read through `useSyncExternalStore`. `StaplerDoc` objects are never mutated.
  `mutateDocs(next, label)` pushes the previous `docs` onto a 25-deep undo stack and logs the op.
  `addDoc` logs but isn't undoable.
- **Ops.** Functions throw `Error` with messages written for the agent. `parsePageSpec` accepts
  `"4-7"` or `"1,3,5-7"` and checks the pages against the real page count.
- **WebMCP registration.**
  - All tools are re-registered under a fresh `AbortController` when the doc signature (names + page counts) changes.
  - Re-registration waits one macrotask. The store emits synchronously inside `execute()`, and re-registering right away would tear down the tool that's still responding.
  - `execute` returns plain strings, not an MCP `{content: [...]}` envelope. Errors come back as `"Error: ..."`.
  - `inspect_document` caps each page at 2000 chars.
- **Samples.** Passport, a 12-page bank statement (salary credits on pages 4-7 only) and a visa form.

## 4. Testing

| Kind | How |
|---|---|
| Sample-data invariants | `npm run smoke` (`scripts/smoke.mts`, runs in Node) |
| Manual drop test | `test/fixtures/`: rental scenario with ID card, employment letter, payslips Jan–Jun |
| End-to-end | A real agent on both surfaces (steps in `README.md`) |

## 5. Deploy

- **Cloudflare Pages project:** `stapler`, direct upload (GitHub isn't connected)
- **URLs:** https://stapler-equ.pages.dev/ (primary), stapler.kharidwise.com (custom domain)

```bash
npm run build
npx wrangler pages deploy dist --project-name=stapler
```

- ⚠️ Always deploy `dist`. Deploying the repo root ships raw source and blanks the site.
- After deploying, check that the homepage loads `/assets/index-*.js` and the badge shows **agent-ready**.
- `index.html` has a first-party WebMCP origin-trial token bound to `stapler-equ.pages.dev`. It expires mid-Nov 2026.
