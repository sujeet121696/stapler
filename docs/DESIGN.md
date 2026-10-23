# Design

> UI/UX direction: what the interface is for, how it's laid out, how it looks.

## 1. Direction

The human **watches** while the agent works. The UI builds trust by showing what's
loaded, what the agent did, and how to reverse it. It should feel like a calm, focused
tool, not a PDF editor full of menus.

## 2. Layout

| Area | Contents |
|---|---|
| Header | Logo (`public/logo.svg`), WebMCP status badge, tagline |
| Workspace (left) | Drop zone (PDF only), **Load sample documents** button while empty, document cards (name, pages, size) |
| Operations log (right) | Timestamped list of every action by the human or the agent, the main feedback during a run |
| Preview modal | In-page PDF iframe. Close with ×, the backdrop, or Esc |

## 3. Visual style

| Token | Value |
|---|---|
| Background | `#0b0f19` |
| Text / muted text | `#e5e7eb` / `#9ca3af` |
| Success badge | `#4ade80` on `#113d2b` |
| Warning badge | `#fbbf24` on `#3d2a11` |
| Font | System UI stack |
| Max content width | 960px |
| Brand gradient | `#4ade80` → `#14b8a6` (logo, favicon) |

Dark theme only. Pill badges, rounded cards, minimal chrome.

## 4. Principles

1. Every agent action shows up in the op log immediately.
2. Undo is always within reach, so mistakes are cheap.
3. Copy is plain and stresses privacy ("never leaves your device").
4. Controls have text labels. Cards and the modal work from the keyboard (Enter/Space, Esc).
5. One polished workflow beats many half-finished features.
