# 📎 Stapler

**Tell your browser what you need done with your documents. The agent handles
the workflow — while your files never leave your device.**

Stapler is a local document workspace that lets an AI agent turn a
natural-language document task into a sequence of real document operations.
It registers structured [WebMCP](https://github.com/webmachinelearning/webmcp)
tools with the browser (`document.modelContext.registerTool`), so an agent can
chain them together to complete a goal like *"prepare my visa application
package"*. The agent reads your documents to find the relevant pages itself;
every operation runs client-side (pdf-lib / pdf.js), so your files stay in
browser memory and are never uploaded anywhere.

Built for the [WebMCP Challenge](https://webmcp.devpost.com/).

**Live app: https://stapler-equ.pages.dev/** — no login, no setup. The page
ships a Chrome origin-trial token, so WebMCP works on stock Chrome 149+ with
no flags.

## Try it in 2 minutes

You need an agent that speaks WebMCP. Two options:

- **ChatGPT's in-app browser** ([Site tools](https://learn.chatgpt.com/docs/webmcp)):
  open the site in the desktop app's built-in browser (Cmd+Shift+B) with
  **Enable site tools** on (Settings → Browser → Permissions; it's the default).
  If ChatGPT offers to **"Continue in Work"**, accept — Work mode is the layer
  that drives the page's tools. (Not available in Enterprise/Edu workspaces.)
- **Chrome + Google's
  [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd)
  extension** — works on any Chrome today; its prompt mode drives the page's
  tools with Gemini (bring a free
  [Google AI Studio API key](https://aistudio.google.com/apikey)).

1. Open **https://stapler-equ.pages.dev/**. The badge next to the logo should
   read **agent-ready** — the page has registered its tools with the browser.
2. Click **"Load sample documents (fictional visa scenario)"** — three
   generated PDFs appear: a specimen passport, a 12-page bank statement, and
   a visa application form. All data is fictional.
3. Ask the agent (in ChatGPT, or in the extension's side-panel prompt box):

   > I'm applying for a visa. I need one PDF with my passport, the bank
   > statement pages that prove my regular salary, and my application form.
   > Name the file after the applicant and its purpose, and download it.

4. Watch the **Operations** log. The agent lists the documents, reads the
   bank statement page by page, finds the salary pages on its own, extracts
   them, merges everything, and downloads the result — named after the
   applicant (e.g. `arjun-kumar-visa-packet.pdf`), whose name it read off the
   passport. You never told it a page number, or even a name — and no
   document ever left the tab.

5. Click any document card to preview the PDF right on the page — including
   the packet the agent just built.

## Agent tools

| Tool | What it does |
|---|---|
| `list_documents` | Lists loaded documents with page counts and sizes (read-only) |
| `inspect_document` | Reads a document's text page by page, so the agent can find relevant pages itself (read-only) |
| `extract_pages` | Copies pages (e.g. `"4-7"`, `"1,3,5-7"`) into a new document |
| `merge_documents` | Combines documents, in order, into a new document |
| `rename_document` | Renames a document in the workspace |
| `export_document` | Downloads a document to the user's machine |
| `undo` | Reverts the last workspace change |

Every action — human or agent — appears in the on-page operations log, and
`undo` makes agent mistakes recoverable. The agent proposes and orchestrates;
deterministic client-side code executes.

## Setup from scratch

Prerequisites: [Node.js](https://nodejs.org/) 20+ (includes npm).

```bash
git clone <this-repo>
cd stapler
npm install
npm run dev        # → http://localhost:5173
```

Other commands:

```bash
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run lint       # oxlint
npm run smoke      # Node smoke test: generates the sample docs and verifies
                   # the salary credits sit on pages 4-7 of the statement
```

### Testing on Chrome

The deployed site carries an origin-trial token, so Chrome 149+ exposes the
WebMCP API there with no flags. Chrome has no built-in agent chat, but
Google's [Model Context Tool Inspector](https://developer.chrome.com/docs/ai/webmcp)
extension (Chrome Web Store) fills that role — it lists registered tools,
lets you invoke them manually, and can drive them from a natural-language
prompt (Gemini-powered):

1. `chrome://flags/#enable-webmcp-testing` → **Enabled** (needed for
   `localhost`; the deployed site doesn't need it)
2. Install the **Model Context Tool Inspector** extension to invoke tools
   manually or run the demo prompt against them.
3. Optional: `chrome://flags/#devtools-webmcp-support` → **Enabled**, relaunch;
   DevTools → **Application → WebMCP** then lists the registered tools and
   shows every tool call live in **Tool Activity** — great for debugging what
   an agent actually did.

Both paths are verified end-to-end against this site: the complete hero
workflow (find salary pages → extract 4-7 → merge → download) runs with the
extension's prompt mode and in ChatGPT's in-app browser (via Work mode).

## How it works

```
┌─ browser tab ────────────────────────────────────────────┐
│  Stapler UI (React)      ← op-log shows every action     │
│  WebMCP layer (webmcp.ts) ← tools the agent can call     │
│  Operations (ops.ts)      ← find/extract/merge/rename    │
│  PDF engines              ← pdf-lib (edit) + pdf.js (read)│
│  Document store           ← files live in memory only    │
└───────────────────────────────────────────────────────────┘
        ▲ tool calls (WebMCP)
   agent (ChatGPT browser / Chrome)
```

No backend. No uploads. No accounts. The repo has no sample binaries either —
the demo documents are generated in the browser by `src/samples.ts`.

## License

MIT — see [LICENSE](./LICENSE).
