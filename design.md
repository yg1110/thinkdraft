---
version: alpha
name: Thinkdraft-design-system
description: A developer memo app inspired by Apple's design philosophy — minimal chrome, content-first, photography-free. The UI recedes so the writing can speak. Uses the same SF Pro type system, single-accent-color discipline, and surface-alternation rhythm, but adapted for a productivity tool context with dark-mode-first defaults suited to developers.

colors:
  # Brand Accent — single color for all interactive elements
  primary: "#0A84FF"
  primary-hover: "#409CFF"
  primary-muted: "rgba(10, 132, 255, 0.15)"
  primary-on-dark: "#0A84FF"

  # Surfaces (dark-mode-first)
  canvas: "#1C1C1E"
  canvas-elevated: "#2C2C2E"
  canvas-secondary: "#3A3A3C"
  canvas-input: "#1C1C1E"
  canvas-light: "#F5F5F7"
  surface-black: "#000000"

  # Text
  ink: "#F5F5F7"
  ink-secondary: "#AEAEB2"
  ink-tertiary: "#636366"
  ink-on-light: "#1D1D1F"
  ink-danger: "#FF453A"
  ink-success: "#30D158"
  ink-warning: "#FFD60A"

  # Borders
  hairline: "rgba(255, 255, 255, 0.08)"
  hairline-active: "rgba(255, 255, 255, 0.16)"
  divider: "rgba(255, 255, 255, 0.04)"

typography:
  app-title:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: -0.28px
  page-title:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.22px
  section-title:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.24
    letterSpacing: -0.374px
  body:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: -0.24px
  body-strong:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.47
    letterSpacing: -0.24px
  caption:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.38
    letterSpacing: -0.08px
  caption-strong:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.38
    letterSpacing: -0.08px
  mono:
    fontFamily: "SF Mono, ui-monospace, Menlo, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  tag:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px

components:
  # ──────────────────────────────────────
  # Sidebar
  # ──────────────────────────────────────
  sidebar:
    backgroundColor: "{colors.surface-black}"
    width: 260px
    padding: "{spacing.sm} {spacing.xs}"

  sidebar-item:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs} {spacing.sm}"
    height: 32px

  sidebar-item-active:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.primary}"

  sidebar-section-title:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.caption-strong}"
    padding: "{spacing.md} {spacing.sm} {spacing.xxs}"
    textTransform: uppercase

  # ──────────────────────────────────────
  # Memo Editor (main area)
  # ──────────────────────────────────────
  editor-area:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.xl} {spacing.xxl}"

  editor-title-input:
    textColor: "{colors.ink}"
    typography: "{typography.page-title}"
    backgroundColor: transparent
    border: none
    padding: 0

  editor-body:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    backgroundColor: transparent

  editor-code-block:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"

  # ──────────────────────────────────────
  # Memo List (middle panel)
  # ──────────────────────────────────────
  memo-list-panel:
    backgroundColor: "{colors.canvas-elevated}"
    width: 300px
    borderRight: "1px solid {colors.divider}"

  memo-list-item:
    padding: "{spacing.sm} {spacing.md}"
    borderBottom: "1px solid {colors.divider}"

  memo-list-item-title:
    textColor: "{colors.ink}"
    typography: "{typography.section-title}"

  memo-list-item-preview:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"

  memo-list-item-date:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.caption}"

  memo-list-item-active:
    backgroundColor: "{colors.primary-muted}"

  # ──────────────────────────────────────
  # Tags
  # ──────────────────────────────────────
  tag:
    backgroundColor: "{colors.canvas-secondary}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.tag}"
    rounded: "{rounded.xs}"
    padding: "3px 8px"

  tag-ai-suggested:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.primary}"
    typography: "{typography.tag}"
    rounded: "{rounded.xs}"
    padding: "3px 8px"
    border: "1px dashed {colors.primary}"

  # ──────────────────────────────────────
  # AI Features
  # ──────────────────────────────────────
  ai-panel:
    backgroundColor: "{colors.canvas-elevated}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"

  ai-suggestion-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"

  ai-coach-banner:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md} {spacing.lg}"

  # ──────────────────────────────────────
  # Blog Preview
  # ──────────────────────────────────────
  blog-preview:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink-on-light}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"

  blog-template-chip:
    backgroundColor: "{colors.canvas-secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"

  blog-template-chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"

  # ──────────────────────────────────────
  # Buttons
  # ──────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 18px"

  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 18px"
    border: "1px solid {colors.primary}"

  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "6px 12px"

  button-danger:
    backgroundColor: "rgba(255, 69, 58, 0.12)"
    textColor: "{colors.ink-danger}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 18px"

  # ──────────────────────────────────────
  # Inputs
  # ──────────────────────────────────────
  search-input:
    backgroundColor: "{colors.canvas-input}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    border: "1px solid {colors.hairline}"
    height: 36px

  search-input-focus:
    border: "1px solid {colors.primary}"

  # ──────────────────────────────────────
  # Toolbar
  # ──────────────────────────────────────
  toolbar:
    backgroundColor: "{colors.canvas}"
    borderBottom: "1px solid {colors.divider}"
    height: 44px
    padding: "0 {spacing.md}"

  toolbar-button:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xxs}"
    size: 28px

  toolbar-button-active:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.primary}"

  # ──────────────────────────────────────
  # Wiki Link
  # ──────────────────────────────────────
  wiki-link:
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    textDecoration: "underline dotted"

  wiki-link-missing:
    textColor: "{colors.ink-danger}"
    typography: "{typography.body}"
    textDecoration: "underline dotted"

  # ──────────────────────────────────────
  # Status / Sync
  # ──────────────────────────────────────
  sync-indicator:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.caption}"

  sync-indicator-synced:
    textColor: "{colors.ink-success}"

  sync-indicator-offline:
    textColor: "{colors.ink-warning}"

  # ──────────────────────────────────────
  # Weekly Report
  # ──────────────────────────────────────
  report-card:
    backgroundColor: "{colors.canvas-elevated}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"

  stat-number:
    textColor: "{colors.primary}"
    typography: "{typography.app-title}"

  stat-label:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
---

## Overview

Thinkdraft is a **developer-first memo app for macOS** built with Wails (Go + React). The design philosophy borrows Apple's core principles — content supremacy, single-accent discipline, surface-alternation rhythm — but adapts them for a **dark-mode-first productivity tool** where the content is text, not product photography.

The interface follows a **three-panel layout**: a narrow dark sidebar for navigation, a middle panel for the memo list, and a wide editor area. Chrome is invisible. The memo itself is the hero. No decorative gradients, no unnecessary shadows, no visual noise.

**Key Characteristics:**

- **Dark-mode-first.** Developers live in dark themes. The canvas is `#1C1C1E` (Apple's system dark gray), not black — pure black is reserved for the sidebar to create depth hierarchy.
- **Single accent: System Blue** (`#0A84FF`). Every interactive element — links, buttons, active states, AI suggestions — uses this one color. No second accent exists.
- **SF Pro type system** scaled for a productivity context. Body at 15px (not 17px — denser content needs tighter reading). Monospace for code blocks. Negative letter-spacing on titles only.
- **Three-panel layout** mirrors Apple Notes / Obsidian mental model: sidebar | list | editor. Developers already know this pattern.
- **AI features are quiet.** AI suggestions use `{colors.primary-muted}` (blue at 15% opacity) — visible but never loud. The AI is a gentle coach, not a flashing notification.

## Layout

### Three-Panel Structure

```
┌──────────┬────────────┬──────────────────────────────┐
│ Sidebar  │ Memo List  │ Editor                       │
│ 260px    │ 300px      │ flex: 1                      │
│          │            │                              │
│ #000000  │ #2C2C2E    │ #1C1C1E                      │
│          │            │                              │
│ Nav      │ Search     │ Title                        │
│ Tags     │ Memo cards │ Body (markdown)              │
│ AI Coach │ Date sort  │ Tags                         │
│ Settings │            │ AI actions                   │
└──────────┴────────────┴──────────────────────────────┘
```

### Spacing

- **Base unit:** 8px. All structural spacing snaps to multiples of 4/8.
- **Editor padding:** `{spacing.xl}` (32px) horizontal, `{spacing.xxl}` (48px) top — generous breathing room for writing.
- **Sidebar padding:** `{spacing.sm}` (12px) — tight, utility-focused.
- **Memo list item padding:** `{spacing.sm} {spacing.md}` (12px 16px) — scannable density.

### Responsive (Window Resize)

| Window Width | Behavior |
|-------------|----------|
| >= 900px | Three-panel: sidebar + list + editor |
| 600-899px | Two-panel: sidebar collapses to icon-only (48px), list + editor |
| < 600px | Single-panel: editor only, navigation via overlay |

## Depth & Elevation

Following Apple's philosophy: **no decorative shadows.** Depth comes from surface color stepping.

| Level | Surface | Color | Use |
|-------|---------|-------|-----|
| 0 (deepest) | Sidebar | `#000000` | Navigation anchor |
| 1 (base) | Editor | `#1C1C1E` | Primary writing surface |
| 2 (elevated) | List panel, cards | `#2C2C2E` | Secondary panels, AI panels |
| 3 (input) | Code blocks, inputs | `#3A3A3C` | Interactive containers |

No box-shadows on any element. The only "shadow" is the natural contrast between surface levels.

## Component Guide

### Sidebar

The sidebar is the **navigation spine**. Pure black background (`#000000`) creates maximum separation from the editor. Items use `{typography.body}` at secondary ink color, switching to `{colors.primary-muted}` background + `{colors.primary}` text when active.

Section headers (All Memos, Tags, Wiki, AI Coach) use `{typography.caption-strong}` in `{colors.ink-tertiary}`, uppercase, with generous top margin (`{spacing.md}`).

### Memo Editor

The editor is intentionally spartan — no visible toolbar by default. Title is a plain `{typography.page-title}` input with no border. Body is a markdown-aware textarea in `{typography.body}`. Code blocks get a subtle elevated background with `{typography.mono}`.

**Auto-save indicator** sits in the toolbar area: a small dot + "Saved" / "Offline" / "Syncing" in `{typography.caption}`.

### Tags

Two tag variants:
- **User tags**: solid `{colors.canvas-secondary}` background, quiet
- **AI-suggested tags**: `{colors.primary-muted}` background with a dashed blue border — clearly machine-generated, easy to accept or dismiss

### AI Features

All AI UI follows one rule: **blue-tinted, never loud.**

- **AI Coach Banner**: appears at the top of the sidebar or editor when AI has a suggestion. Uses `{colors.primary-muted}` background. Dismissible.
- **AI Suggestion Card**: appears in a panel when the user triggers "Organize" or "Generate blog post". White text on elevated surface, with action buttons.
- **Blog Template Chips**: pill-shaped selectors (TIL, Troubleshoot, Concept, Retrospective). Unselected = dark gray. Selected = solid `{colors.primary}`.

### Blog Preview

When AI generates a blog draft, the preview renders on a **light surface** (`{colors.canvas-light}` / `#F5F5F7`) with dark text (`{colors.ink-on-light}`). This deliberate contrast shift signals "this is what readers will see" — a preview of the published output, not part of the editor.

### Weekly Report

The report card uses `{colors.canvas-elevated}` with stat numbers in `{colors.primary}` at `{typography.app-title}` size. Key stats: memos written, tags used, topics covered, streak days. Clean, dashboard-like, no charts in MVP — just bold numbers.

## Do's and Don'ts

### Do

- Use `{colors.primary}` (#0A84FF) for every interactive element. One accent, no exceptions.
- Keep the editor chrome-free. No visible toolbar until hover/focus. The text is the interface.
- Use surface color stepping (black → dark gray → gray) for depth. Never box-shadows.
- Make AI features dismissible and non-intrusive. Blue-tinted, never red/orange urgency.
- Use `{typography.mono}` for all code-related content. Developers expect monospace.
- Keep negative letter-spacing on titles only (`{typography.app-title}`, `{typography.page-title}`).
- Auto-save everything. Never show a "Save" button. The sync indicator is sufficient.

### Don't

- Don't introduce a second accent color. No green for "success" actions, no orange for warnings in the core UI. Status colors (danger, success, warning) are only for system indicators (sync, errors).
- Don't add shadows or gradients. Depth = surface color only.
- Don't make AI features feel urgent or attention-grabbing. They're suggestions, not alerts.
- Don't put borders on the editor area. The writing surface should feel infinite.
- Don't use rounded.pill for buttons — that's Apple Store grammar. Thinkdraft uses `{rounded.md}` (8px) for buttons. Pill shape is reserved for template chips only.
- Don't mix fonts. SF Pro Display for titles, SF Pro Text for body, SF Mono for code. Three families, strict boundaries.

## Interaction Patterns

### Micro-interactions

- **Button press**: `transform: scale(0.97)` + `opacity: 0.9` (subtler than Apple's 0.95 — this is a productivity tool, not a store)
- **Sidebar item hover**: background fades in at `{colors.hairline}` opacity
- **Memo list item hover**: left border appears in `{colors.primary}` (2px)
- **Tag dismiss**: fade out + collapse width over 150ms
- **AI suggestion appear**: slide down + fade in over 200ms

### Keyboard-First

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+N` | New memo (global, works even when app is not focused) |
| `Cmd+N` | New memo (in-app) |
| `Cmd+K` | Quick search / command palette |
| `Cmd+Enter` | Trigger AI organize |
| `Cmd+T` | Add tag |
| `Cmd+[` / `Cmd+]` | Navigate memo list |
| `Cmd+\` | Toggle sidebar |
