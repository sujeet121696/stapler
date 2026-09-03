# Stapler — build brief (locked Aug 28)

> **"Tell your browser what you need done with your documents. The agent handles
> the workflow — while your files never leave your device."**
>
> WebMCP Challenge · webmcp.devpost.com · deadline **Sept 3, 1:00pm PDT
> (= Sept 4, 1:30am IST)** · our internal deadline: **Sept 2 evening IST**.
> Working title "Stapler" — swappable until submission (PDF Pilot → pilotpdf.com
> taken; InTab → intab.io taken; Stapler verified clear in-category Aug 28).

## Thesis (the "impossible before" answer)

Today you choose between two kinds of document tools:
- **Cloud AI** (ChatGPT, ChatPDF, Adobe AI): smart, conversational — but you must
  **upload** your bank statement / passport to someone's server.
- **Local tools** (PilotPDF, ilovepdf, Stirling): private — but **dumb**: you do
  every click yourself, one operation per menu screen.

**Stapler combines local document processing with agent-orchestrated workflows
through WebMCP.** The defensible "impossible before" statement (mechanism, not
market — never claim "first"): *WebMCP makes it possible for an agent to invoke
structured document operations directly inside the user's browser, while the
files remain local.* Every operation executes client-side (pdf-lib/pdf.js);
the agent chains the tools; the files stay in browser memory.

Product framing: **a local document workspace that lets an AI agent turn a
natural-language document task into a sequence of real document operations.**
Not "a better PDF editor."

Three selling points (write-up structure):
1. **Intent instead of steps** — you describe the outcome, not the operations.
2. **Privacy** — sensitive documents never leave the browser.
3. **WebMCP-native** — the agent isn't clicking UI; it chains structured tools.

## Hero workflow (the ONE thing we polish)

**Visa / official-application document prep.** "Load sample documents" button
loads the scenario: passport scan, 12-page bank statement (text-based),
filled application form, photo page.

**The wow moment is `inspect_document`, not merging.** The user does NOT know
which pages contain the relevant information — the agent finds them. The whole
presentation is built around: *"I didn't tell the agent which pages to use.
It figured that out."* Intent → document understanding → tool orchestration →
finished artifact.

Demo script (<90s of the video; prompt verified live Aug 29, two clean runs):
1. Click "Load sample documents".
2. Say: *"I'm applying for a visa. I need one PDF with my passport, the bank
   statement pages that prove my regular salary, and my application form.
   Name the file after the applicant and its purpose, and download it."*
3. Agent chains: `list_documents → inspect_document(×3)` → `extract_pages(4-7)`
   (it finds the salary months itself — it even reads the visa form's own
   supporting-documents checklist first) → `merge_documents` →
   `export_document`.
4. Op-log animates live on screen as each tool fires; download appears,
   named after the applicant (e.g. arjun-kumar-visa-packet.pdf).
5. Kicker line: *"I never told it the page numbers — or even my name. And my
   documents never left this laptop."*

Use-case gallery (write-up only, one line each — NOT built): banking excerpts,
rental application package, job application (resume+certs+portfolio),
insurance claim, university admission, legal page separation, tax/receipt
organization, monthly expense-report package.

## Toolset — CORE 7 FIRST, nothing else until the hero workflow is perfect

Registered via `document.modelContext.registerTool`.

| Core tool | Notes |
|---|---|
| `list_documents` | names, page counts, sizes |
| `inspect_document` | **the hero**: metadata + per-page text (pdf.js) so the agent can FIND content ("March–June pages") without the user knowing page numbers |
| `extract_pages` | page-range schema **bounded by the doc's actual page count** |
| `merge_documents` | **registers only when ≥2 docs loaded** (dynamic registration) |
| `rename_document` | |
| `export_document` | triggers download |
| `undo` | pops the op stack — trust + human-in-the-loop story |

**Deferred until hero workflow works perfectly** (add only with spare time, in
this order): `split_document`, `rotate_pages`, `delete_pages`,
`reorder_pages`, `compress_document` (pdf.js render→canvas→re-encode). No OCR,
no elaborate PDF editing — not this week.

**Success condition (end of first full build day):** Load sample docs → agent
discovers tools → inspects bank statement → identifies pages → extracts →
merges → renames → exports, reliably. If that works, we have a hackathon
project; everything after is polish.

Skillful-use signals for judges: dynamic registration (merge appears/disappears),
schemas regenerated on every change (filenames as enums, page ranges bounded —
the agent literally can't misspell a file), `toolchange` firing constantly,
AbortController cleanup, multi-tool chains visible in the agent UI.

UI: file-drop zone + thumbnail rail (pdf.js) + **live operation log** (fills as
tools fire) + undo button + download tray. The human watches, verifies, reverses.

## Architecture

React + Vite + TypeScript. `pdf-lib` (ops) + `pdf.js` (thumbnails, text
extraction). **Zero backend** — files live in browser memory only (no upload,
no storage; refresh = clean slate, which IS the privacy feature). Deploy static
to Cloudflare Pages (sponsor; also register Chrome origin trial token so plain
Chrome 149+ works without the flag).

Known edges (state plainly in write-up):
- Scanned/no-text-layer PDFs can't be inspected (OCR out of scope; sample docs
  are text-based).
- Compression is stretch, not core.

## Day plan (real capacity ≈ 2 weekend days + 3 evenings ≈ 30–35h)

| Day | Target | Checkpoint |
|---|---|---|
| Fri Aug 28 (eve) | Brief ✅, repo scaffold (git identity FIRST), Vite+React+TS boots ✅ | repo pushes clean ✅ |
| Sat Aug 29 | ~~File-drop + sample-docs button + ALL core 7 tools~~ ✅ DONE (commit 683abee) + BONUS: deployed CF Pages + origin trial live | success condition PARTIAL: tools verified registered in DevTools panel; full agent chain still untested (no test agent in Chrome 151 stable) |
| Sun Aug 30 | **FIRST REAL AGENT RUN** (ChatGPT desktop built-in browser, or Chrome Tool Inspector extension) → tune tool descriptions from what it fumbles; then dynamic schemas + op-log animation + thumbnails | hero workflow bulletproof on a real agent, UI feels like a product |
| Mon Aug 31 (eve) | Polish UI; compress spike (timeboxed 2h); README | "complete product" feel |
| Tue Sept 1 (eve) | ~~Deploy~~ ✅ done Aug 29; re-test both surfaces after tuning | hero workflow passes on BOTH judge surfaces |
| Wed Sept 2 (eve) | Video (<3 min, YouTube) + write-up + SUBMIT | submitted with >24h buffer |
| Thu Sept 3 | Buffer only | — |

### Status log (Aug 29 night)
- **Live:** https://stapler-equ.pages.dev/ (CF Pages, personal acct) with
  first-party WebMCP origin-trial token (expires mid-Nov 2026) — verified
  agent-ready on stock Chrome 151, no flags. Third-party tokens do NOT work
  via meta tag on own page; first-party token required.
- All core 7 tools built + registered (verified in DevTools Application →
  WebMCP panel, needs `#devtools-webmcp-support` + `#enable-webmcp-testing`).
- `npm run smoke` proves sample statement has salary credits on pages 4–7 only.
- **Chrome 151 stable has NO built-in test agent** — DevTools WebMCP panel is
  monitor-only (Tool Activity + Available Tools). Gemini side panel does NOT
  consume page tools: it fabricated a fake visa packet (invented person, fake
  India passport via Python) with zero tool calls — screenshot saved as
  write-up contrast material ("agents without WebMCP hallucinate documents").
- **Next hard requirement: first real agent run** against the production URL.
  Everything else is tuning.

### Status log (Aug 29, source re-check)
- **ChatGPT Atlas is deprecated.** The judge surface is the **built-in browser
  in the ChatGPT desktop app** ("Site tools", Cmd+Shift+B) — latest app,
  personal account (not Enterprise/Edu), model **GPT-5.6 Sol or Terra** (Luna
  has WebMCP disabled). Docs: learn.chatgpt.com/docs/webmcp.
- **Chrome DOES have a test agent after all**: Google's **Model Context Tool
  Inspector** extension (Chrome Web Store, per developer.chrome.com/docs/ai/webmcp)
  — manual tool invocation + natural-language prompts via gemini-3-flash-preview.
  Second path to the first real agent run.
- **Execute return shape fixed**: spec + OpenAI docs + webmcp-types all say
  execute returns a plain serializable value, NOT the MCP `{content:[…]}`
  envelope we had. All 7 tools now return plain strings; schemas gained
  `additionalProperties: false` (OpenAI "keep inputs narrow" guidance).
- OpenAI developer showcase has a "WebMCP apps" category with a submit-your-
  project form ("examples coming soon") — post-hackathon exposure opportunity.

### ✅ FIRST COMPLETE HERO RUN (Aug 29, ~17:00 IST) — success condition MET
- Surface: Chrome + Model Context Tool Inspector extension, gemini-3.6-flash,
  free-tier Gemini API key, against production https://stapler-equ.pages.dev/.
- Chain: list_documents → inspect_document ×3 (statement, passport, form) →
  extract_pages("4-7") → merge_documents(passport, salary pages, form) →
  export_document → visa-packet.pdf (7 pages) downloaded.
- **Agent chose pages 4–7 unprompted** and explained why ("Feb, Mar, Apr, May
  2026 salary credits"). It also read the visa form's own checklist ("Proof of
  funds: bank statement pages showing regular salary credits") before deciding
  — document understanding, video-worthy.
- Bugs the run exposed (both fixed + deployed): 500-char inspect truncation hid
  the SALARY CREDIT lines (chars 441–499 → agent guessed 3-7); Jan/Jun
  FREELANCE INVOICE credits made page 3/8 defensible answers (now
  self-transfers; smoke test guards both).
- Gemini free tier = 5 requests/min per project: full run needs one
  "Continue the task from where you stopped" after a 429 (~60s wait). Fresh
  keys in fresh Google Cloud projects give separate quotas.
- Full request/response trace saved via inspector "Copy trace" — write-up gold.
- **Run #2 (17:10, same day): pages 4–7 AGAIN** — page-finding is consistent.
  Prompt variant "Name the file after the applicant" → agent derived
  "arjun-kumar.pdf" from the passport text, unprompted. Video kicker upgrades
  to: *"I never told it the page numbers — or even my name."* For a better
  on-screen filename ask for name **and purpose** (→ arjun-kumar-visa-packet).
- **ChatGPT desktop app tested (Aug 29 eve): NEGATIVE on this account**
  *(SUPERSEDED same evening — see next bullet).*
  Latest app, personal FREE account, built-in browser (Cmd+Shift+B), page
  agent-ready, samples loaded, model GPT-5.6 Sol — but NO Site tools control
  in the address bar (only Connection secure / Site settings), no tool calls,
  no approval prompts, and the chat gave no reply at all (prompt sent twice).
  Conclusion: Site tools is tier- or rollout-gated; NOT a Stapler bug (tools
  register fine — DevTools + extension both list them on the same page).
  README now leads with the verified Chrome + Tool Inspector path; ChatGPT
  kept as option per Devpost's own judge instructions ("supports WebMCP out
  of the box" — judges presumably have it enabled).
- **✅ ChatGPT desktop VERIFIED (Aug 29, 18:09 IST) — BOTH judge surfaces now
  pass end-to-end.** The unlocks: full app restart (the earlier total silence
  was a stuck session), and the **"Continue in ChatGPT Work"** handoff — plain
  chat still answers "please upload the files", but accepting Work mode ran
  the whole chain on the LOCAL tab (ops-log timestamps in the user's browser):
  extract 4-7 → "salary-credit-pages.pdf" (agent's own name) → merge → export
  visa-packet.pdf. Settings → Browser → Permissions → "Enable site tools" was
  ON by default; docs' per-site permissions page has NO WebMCP row (checked).
  Model picker was on Auto and Work mode handled it — no Sol/Terra pinning
  needed in practice. README updated with the Work-mode instruction.
- **✅ Public repo live (Aug 30): github.com/sujeet121696/stapler** — files
  byte-verified against the working repo, history + content audit clean,
  MIT auto-detected. All mechanical submission requirements DONE.
- **Remaining: video + write-up; submit Sept 2.**

### Status log (Aug 30)
- **Multi-file upload bug fixed + deployed** (bundle index-Dzjy8X9d.js): FileList/
  DataTransfer are emptied by the browser once the drop/change event returns, so
  the async read loop only ever got file #1. Fix: `Array.from(files)` snapshot
  before the first await (src/App.tsx). GitHub copy now BEHIND — needs a manual
  push before judging.
- **Rental drop-test scenario PASSED with user's own files** (3 fixture PDFs in
  `webmcp/test/`, fictional "Meera Sharma": id-card, employment-letter,
  payslips Jan–Jun). Prompt: rental application, ID + letter + only Apr–Jun
  payslips → agent picks payslip pages 4–6 itself.
- **Video plan**: visa sample-docs run stays the hero; rental drop-test is an
  optional ~20s second beat ("works on files YOU bring, not just samples") —
  first thing to cut if the 2:30 gets tight.
- **✅ DYNAMIC SCHEMAS SHIPPED + VERIFIED BOTH SURFACES (Aug 30 night — CODE
  FROZEN for recording).** webmcp.ts now re-registers on every workspace
  change: document params are enums of loaded filenames, document tools appear
  at ≥1 doc, merge_documents only at ≥2; re-registration deferred one macrotask
  (store emits synchronously from inside execute(), immediate re-register would
  tear down the responding tool). User verified: Chrome+Tool Inspector (2 tools
  empty → 7 with enums after samples, full visa chain incl. merge-after-extract)
  AND ChatGPT in-app browser end-to-end. Live bundle index-DV3qcuAG.js.
  Re-audit also caught 2 control bytes (\x00,\x01) that codegen embedded in
  webmcp.ts — file now byte-clean. Devpost About needs its dynamic-schemas
  line MOVED from "What's next" into "How we built it".
- **Tagline updated (Aug 31, pre-recording)**: on-page tagline now matches the
  Devpost elevator pitch ("An AI agent preps your documents right in your
  browser via WebMCP — it finds the right pages itself, merges and downloads.
  Your files never leave your device."). Text-only change in App.tsx; frozen
  live bundle is now **index-CRXBK8RS.js**.
- **Custom domain live: https://stapler.kharidwise.com** (added via dashboard,
  free, same deployments serve both URLs). Verified working in ChatGPT in-app
  browser — confirms ChatGPT doesn't need the origin-trial token. Plain Chrome
  on this origin shows "WebMCP not available" (token is bound to
  stapler-equ.pages.dev; second token = optional polish). **Devpost form URL
  stays stapler-equ.pages.dev** — it's the only origin verified on BOTH
  judge surfaces.

## Submission checklist (from rules, re-verified Aug 28)

- [x] **"Join hackathon" clicked on webmcp.devpost.com** ✅ Aug 28
- [x] Live URL judges can open in ChatGPT in-app browser / Chrome —
      no login required ✅ https://stapler-equ.pages.dev/ (origin trial live)
- [x] Public repo ✅ https://github.com/sujeet121696/stapler (pushed Aug 30,
      MIT auto-detected in About sidebar, verified on the public page)
- [x] Repo contains all source/assets/instructions to run ✅ and literally
      uses `document.modelContext.registerTool` (src/webmcp.ts:37)
- [x] <3-min public YouTube video ✅ published Aug 31:
      https://www.youtube.com/watch?v=vlyAxP7YGxY ("Stapler — AI agent preps
      your documents in your browser via WebMCP (Demo)", KharidWise channel,
      public, embeddable, **2:59** — first upload 9WopHg-JNuI was 3:53
      (over the "must be less than 3 minutes" rule), re-cut by speeding up
      wait segments, all 3 scenarios kept; old video to be deleted/unlisted)
- [x] Write-up answers all four required questions ✅ filled on the Devpost
      finalization page Aug 30 (saved as DRAFT — submit happens with the video)
- [x] Original work, solely owned, new code only ✅
- [x] **Devpost SUBMITTED Aug 31** (2.5 days early). Final state verified:
      video 2:59 (vlyAxP7YGxY), repo HEAD e909333 pushed with correct
      identity — all 4 changed files byte-match the working tree, and
      building the pushed code reproduces the exact live bundle
      index-CRXBK8RS.js. Repo + history audited clean (no work strings,
      no secrets, no .DS_Store). Public gallery page appears after deadline.
      Post-deadline: optionally review YouTube auto-captions for "WebMCP";
      OpenAI showcase form is a post-hackathon exposure option.

## Deploy (Cloudflare Pages — exact recipe, learned Aug 30)

Project name is `stapler` (domain got suffixed to stapler-equ.pages.dev because
stapler.pages.dev was taken — domain cannot be changed; custom domain is the
post-hackathon path). Direct-upload project — GitHub is NOT connected; the site
changes ONLY when this is run:

```
npm run build
npx wrangler pages deploy dist --project-name=stapler
```

**NEVER run `wrangler pages deploy` without `dist`** — on Aug 30 a root-folder
deploy shipped the raw source tree and the live homepage went blank (dev
index.html loads /src/main.tsx, which browsers can't run) until dist was
redeployed. Verify after every deploy: homepage must reference
/assets/index-*.js and the agent-ready badge must go green.

