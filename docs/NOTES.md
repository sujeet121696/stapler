# WebMCP — study notes (Aug 28)

> Digest of the spec explainer (github.com/webmachinelearning/webmcp) and
> Chrome developer docs, for the WebMCP Challenge (deadline Sept 3, 1pm PDT).

## What it is, in one line

WebMCP lets a web page register JavaScript functions as **tools** — with a name,
natural-language description, and JSON Schema — that an AI agent (ChatGPT's
browser, Chrome's agent) can discover and call directly, instead of scraping the
DOM and simulating clicks.

## The core API (imperative)

```js
await document.modelContext.registerTool({
  name: "add-todo",
  description: "Add a new item to the user's active todo list",
  inputSchema: {
    type: "object",
    properties: { text: { type: "string", description: "The todo text" } },
    required: ["text"]
  },
  async execute({ text }) {
    await addTodoItemToCollection(text);   // reuse existing client-side logic
    return { content: [{ type: "text", text: `Added "${text}".` }] };
  }
}, { signal: controller.signal });  // AbortController unregisters the tool
```

- Tool calls run **in the page's JS context** — same session, same auth, same UI.
  The page updates live while the agent works (this is the whole point: human +
  agent share one screen).
- `document.modelContext.getTools()` / `executeTool()` — how an in-page agent
  discovers/invokes tools. `toolchange` event fires when tools change.
- **Dynamic registration matters**: tools can appear/disappear with app state
  (e.g. a "checkout" tool only exists once the cart is non-empty).
- Declarative variant: annotate an HTML `<form>` and the browser synthesizes the
  tool automatically.
- Cross-origin iframes: `allow="tools"` permissions policy + `exposedTo` option.

## Key mental model (vs the MCP we know from Resolve)

- Backend MCP: agent platform ↔ your **server**, bypassing the UI entirely.
  Needs its own auth/state replication.
- WebMCP: agent ↔ the **running page**. No separate server, no re-auth — the
  tool executes with whatever session the user already has. The user watches
  every step happen in the UI.
- Design goal: **human-in-the-loop cooperation**, NOT autonomous headless agents.
  Judges will reward "person and agent working together on one screen".

## How to run/test it

1. **Chrome flag (local dev)**: `chrome://flags/#enable-webmcp-testing` →
   Enabled → relaunch. Origin trial available from Chrome 149 for production.
2. **DevTools has a WebMCP panel** (developer.chrome.com/docs/devtools/application/webmcp)
   — inspect registered tools, and a built-in test agent (prompts go to
   `gemini-3-flash-preview`) to check the agent picks the right tools.
3. **ChatGPT in-app browser** — the other judging surface. Judges use either.
4. Submission = live URL + <3-min YouTube video + write-up.

## Starter material (from the challenge resources page)

- Spec + explainer: github.com/webmachinelearning/webmcp (types: `webmcp-types` npm)
- Google docs: developer.chrome.com/docs/ai/webmcp (+ /secure-tools, /evals)
- Cloudflare React template: github.com/cloudflare/agents/tree/main/examples/webmcp-react
- Coffee-store commerce demo: webmcp-coffee.jilles.fyi (source of the genre)
- Vercel shop with WebMCP PR: github.com/vercel/shop/pull/498
- Netlify starter: webmcp-starter.netlify.app
- Chrome demos: github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos
- OpenAI showcase: developers.openai.com/showcase?view=webmcp-apps
- React hook: npmjs.com/package/use-webmcp-tool
- Angular support: angular.dev/ai/webmcp
- Security guide: developer.chrome.com/docs/ai/webmcp/secure-tools ← read early;
  prompt-injection/trust-boundary guidance — our home turf from Resolve's guard
- Sponsor credits: Cloudflare/Vercel/Render/OpenAI credit links on resources page

## Judging criteria (weightings unknown)

1. **WebMCP leverage** — thorough, skillful, non-trivial use of the API
2. **Execution** — complete product experience, not a proof-of-concept
3. **Potential impact** — credible, specific real problem for a real audience
4. **Creativity & ambition** — differs from existing concepts
   (⚠️ the coffee-store demo means "agent-operable shop" is the DEFAULT genre —
   a plain storefront clone scores low on this axis)

## Constraints

- New code only — nothing from Resolve (TGPF exclusivity rule).
- Company laptop rules — see ../PLAN.md (git identity before first commit!).
- Deadline Sept 3, 1pm PDT ≈ Sept 4, 1:30am IST.
