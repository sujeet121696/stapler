# Stapler — demo video script (target 2:30, hard cap 3:00)

Recorded: ChatGPT desktop app → built-in browser (Cmd+Shift+B) → https://stapler-equ.pages.dev/
Rules: audio required · working demo in first 15s · no third-party trademarks beyond the judged surface · no music.

## Setup (before hitting record)
- Fresh ChatGPT chat; Stapler open in the in-app browser, samples ALREADY loaded (agent-ready badge green).
- Prompt pre-typed, ready to send.
- Screen: Stapler split pane (docs + Operations log) is the star; chat beside it.
- Clean desktop, hide bookmarks/dock, 1080p, macOS screen record (Cmd+Shift+5).
- Record screen first, add narration after (QuickTime/iMovie) — cut dead air, 2× agent pauses with a "sped up" caption.
- Dry run once. If ChatGPT stalls, full Cmd+Q restart (known fix).

## The prompt (paste exactly)
> I'm applying for a visa. I need one PDF with my passport, the bank statement
> pages that prove my regular salary, and my application form. Name the file
> after the applicant and its purpose, and download it.

## Script

### 0:00–0:15 — HOOK (hit send immediately)
"This is Stapler — a document workspace where an AI agent does the document
work for you, and your files never leave your browser. I've loaded a passport,
a 12-page bank statement, and a visa form. I'm asking for a visa packet —
watch the operations log. I'm not going to tell it which pages to use."

### 0:15–0:40 — the problem (while agent starts)
"Today you have to choose. Cloud AI tools are smart, but you upload your bank
statement to someone's server. Local PDF tools are private, but you do every
click yourself. Stapler removes that trade-off using WebMCP: the page registers
seven document tools, and the agent calls them right here in the browser.
Every operation runs client-side. There is no backend at all."

### 0:40–1:40 — the run (narrate ops log as entries appear)
"The agent lists the documents, then inspects them — reading each page's text.
Here's my favorite part: it reads the visa form's own supporting-documents
checklist, which asks for proof of regular salary. Then it scans the bank
statement and finds the salary credits — pages 4 to 7, February through May.
I never told it that."

"Now it extracts those four pages... merges them with the passport and the
form... and exports."

### 1:40–2:05 — payoff (download appears; click packet card → preview modal, scroll)
"Done. And look at the filename: arjun-kumar-visa-packet — it read the
applicant's name off the passport. I can click any document to verify it right
here: passport, four salary pages, application form. Everything the agent did
is in the log, and every step is undoable."

### 2:05–2:30 — how + close (stay on Stapler; optional brief DevTools WebMCP panel)
"Under the hood: seven WebMCP tools registered with the model-context API, with
schemas that update live — the merge tool only exists when two or more
documents are loaded, and filenames are enums, so the agent can't misspell a
file. PDF work is pdf-lib and pdf.js, fully in-browser. It works in ChatGPT's
built-in browser and in Chrome. Try it at stapler-equ.pages.dev — the repo is
on GitHub. My files never left this laptop — and neither will yours."

## After recording
- Upload YouTube as PUBLIC or UNLISTED (not private). Title: "Stapler — WebMCP demo".
- Paste URL into Devpost video field → tick terms → Submit.
