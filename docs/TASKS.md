# Tasks

> What's done, what's next, and known limitations. Keep this current.

## 1. Next version (branch `NextVrsion`)

**To decide**
- [ ] Define the post-hackathon scope (goals for this version)

**Features**
- [ ] Postponed tools, in priority order: `split_document`, `rotate_pages`, `delete_pages`, `reorder_pages`, `compress_document`
- [ ] Page thumbnails on document cards (pdf.js)
- [ ] Undo button in the UI (today only the agent can undo, via the `undo` tool)

**Quality**
- [ ] Automated tests for `ops.ts` (`parsePageSpec`, extract, merge)

**Ops**
- [ ] Renew the WebMCP origin-trial token before it expires (mid-Nov 2026)
- [ ] Add an origin-trial token for `stapler.kharidwise.com`
- [ ] Submit to the OpenAI showcase ("WebMCP apps")

## 2. Done — v1 (WebMCP Challenge, submitted Aug 31 2026)

- [x] Core 7 WebMCP tools with live schemas and dynamic registration
- [x] PDF drop/pick (multi-file), sample visa documents, op log, undo, preview modal
- [x] `npm run smoke` guarding sample data
- [x] Deployed to Cloudflare Pages with origin-trial token and custom domain
- [x] Verified end-to-end on ChatGPT in-app browser and Chrome + Tool Inspector
- [x] Public repo, README, <3-min demo video, Devpost submission

## 3. Known limitations

- Scanned PDFs with no text layer can't be inspected (no OCR).
- Undo covers document changes only. Loading files isn't undoable.
