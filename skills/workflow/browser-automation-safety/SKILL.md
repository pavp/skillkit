---
name: browser-automation-safety
description: "Trigger: about to use browser automation: Playwright, Puppeteer, browser MCP, launch chromium, navigate a page, screenshot, drive a UI. Imposes resource limits so a run never exhausts memory or leaks browsers. Rules authority, not an actor."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Load BEFORE the first browser call whenever a run will drive a browser: launching Playwright/Puppeteer/chromium, calling a browser MCP server, navigating a page, taking a screenshot, or driving a web UI. Apply the rules to every browser call that follows for the rest of the run.

Do NOT load to decide *whether* to use a browser, to author page logic, or to interpret results — this skill only governs HOW to use one safely. It never launches or drives a browser itself.

## Hard Rules

- Close every context and page you open — teardown on EVERY exit path, including error, early return, and first-failure stop. An unclosed context is the top cause of memory exhaustion; a leaked browser process poisons the next run. This rule outranks all others.
- Within one run, use ONE browser instance and get parallelism from multiple contexts inside it — never launch a second browser for concurrency, and never launch one inside a loop. (Independent agent processes each owning a browser is a separate, RAM-budgeted case — references → "Concurrency budget".)
- To inspect a UI, use a viewport screenshot or (preferably) a structured accessibility-tree snapshot — never `fullPage`. A `fullPage` capture renders the entire scroll height into memory; on an infinite/virtualized or broken-height page that is gigabytes. Reserve `fullPage` for a deliverable on a confirmed bounded-height page, never for verification.
- Put an explicit timeout on every navigation, wait, and action. An operation without a bound can hang the run indefinitely.
- Give each parallel task a unique `userDataDir` (or isolated context) so sessions never overwrite each other's cookies and storage.
- Scale concurrency to available RAM, not to ambition: start at 5–10 contexts and raise only after measuring headroom. See references → "Concurrency budget".
- Never install or provision browsers or browser tooling — use only what the project already has. If it is absent, report that and stop; do not set it up.

## Decision Gates

| Condition | Action |
|---|---|
| Browser MCP server (e.g. official Playwright MCP) | It defaults to accessibility-tree snapshots — read structure from the snapshot; request a screenshot only when pixels are genuinely required, viewport-scoped. |
| Direct Playwright/Puppeteer (you write the calls) | You own every guard — apply all Hard Rules explicitly; nothing is defaulted for you. |
| Need to inspect layout/content | Snapshot or viewport screenshot. `fullPage` is never the tool for verification — allowed only as a deliverable on a confirmed bounded-height page. |
| Long or repeated job | Recycle the context between units (fresh context, same browser) to shed accumulated memory; this bounds a long run's footprint instead of letting one context grow unbounded. |
| Tooling absent / browsers not provisioned | Report and stop. Never install. |

## Execution Steps

Apply these to the calling task's browser use — this skill directs, it never launches or drives a browser itself.

1. Identify the mode (browser MCP vs direct) and confirm the tooling is already present; if absent, tell the caller to stop rather than install.
2. Hold the caller to one browser instance per run, with a context per parallel task, within the RAM budget (references → "Concurrency budget").
3. Require the Hard Rules on every call: a timeout, snapshot-first, no `fullPage`.
4. Require teardown on every exit path — success, error, first-failure stop: the caller closes pages and contexts, then the browser, then reaps orphaned PIDs.
5. If teardown fails, have the caller surface the PID/path so it can recover before the next run.

## Output Contract

This skill produces no artifact and no report. It constrains how the calling task uses the browser. If it blocks an action (tooling absent, only `fullPage` available for a mutating flow), state the rule that fired and the safe alternative in one line, then defer to the caller.

## References

- [references/resource-limits.md](references/resource-limits.md) — why each rule exists (dominant failure modes), the concurrency budget by RAM, teardown patterns for MCP and direct modes, and snapshot-vs-screenshot detail.
