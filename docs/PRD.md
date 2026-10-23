# Product Requirements

> What Stapler is, who it's for, and what it deliberately doesn't do.

## 1. Problem

People preparing document packages (visa, rental, job or insurance applications)
have to pick one of two options:

| Option | Good | Bad |
|---|---|---|
| Cloud AI tools | Smart and conversational | You upload your passport or bank statement to a server |
| Local PDF tools | Private | You do every step by hand, one menu at a time |

## 2. Solution

A local document workspace where an AI agent turns a plain-language task into a
sequence of real document operations. The agent calls structured WebMCP tools,
and deterministic client-side code does the work.

**Value props**
1. **Intent instead of steps.** Describe the outcome, not the operations.
2. **Privacy.** Files stay in browser memory, and a refresh clears everything.
3. **WebMCP-native.** The agent calls typed tools instead of clicking the UI.

## 3. Users and surfaces

- **Users:** people with sensitive PDFs who already use an AI agent.
- **Agent surfaces:**
  - The ChatGPT desktop app's in-app browser (Site tools, Work mode)
  - Chrome 149+ with Google's Model Context Tool Inspector extension

## 4. Core workflow

This must always work:

1. The user loads PDFs (drop or pick them, or click **Load sample documents**).
2. The user asks: *"One PDF with my passport, the bank statement pages that prove my salary, and my application form. Name it after the applicant and download it."*
3. The agent runs `list_documents → inspect_document → extract_pages → merge_documents → export_document` and finds the right pages and the applicant's name by itself.
4. The operations log shows each step live, and `undo` can revert any of them.

## 5. Functional requirements

| # | Requirement |
|---|---|
| F1 | Tools: `list_documents`, `inspect_document`, `extract_pages`, `merge_documents`, `rename_document`, `export_document`, `undo` |
| F2 | Tool schemas follow the workspace live. Document params are enums of loaded filenames, document tools appear at ≥1 doc, `merge_documents` at ≥2 |
| F3 | Every action by the human or the agent appears in the operations log |
| F4 | Any document, including agent-built ones, can be previewed in the page |
| F5 | No login, no setup, works as a static site |

## 6. Out of scope

- Server-side processing, uploads, accounts or persistence
- OCR (scanned PDFs without a text layer can't be inspected)
- Rich PDF editing: annotations, form filling, text edits
- Non-PDF formats
- A built-in chat or agent (the agent comes from the browser)
