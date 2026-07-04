# Browser Automation Safety — Resource Limits

Why each Hard Rule exists, and the numbers behind the concurrency budget. This is the evidence the rules stand on; the SKILL.md body carries the rules themselves.

## Dominant failure modes (ranked)

1. **Unclosed contexts / pages / connections.** The most *frequent* source of memory exhaustion in long agent-driven browser runs (distinct from the most acute single event — see #3). Contexts, orphaned page objects, and stale WebSocket connections that are never closed accumulate until the machine thrashes or the process is killed. This is why teardown-on-every-exit-path outranks every other rule — it fires on every run, and a run that closes cleanly rarely exhausts memory even if it is otherwise sloppy.
2. **Multiple launched browser instances.** A browser instance is a full process (hundreds of MB). A context inside an existing browser is ~20–50 MB. Getting parallelism from launched browsers instead of contexts multiplies process-level overhead for no benefit. Launching a browser inside a loop is the classic way to fund a crash.
3. **Full-page screenshots.** `fullPage: true` renders the entire scroll height into memory. On a page with a broken height chain or infinite/virtualized content, that is gigabytes for a single call — the most *acute* failure (a single call can hang the machine outright), even though it is rarer than #1. Verification never needs it: a viewport screenshot is bounded, and a structured snapshot is cheaper still.
4. **Unbounded operations.** A navigation or wait with no timeout can hang forever — indistinguishable from a crash to the caller, and it holds all the run's resources open while it hangs.

## MCP mode vs direct mode

- **Browser MCP server** (e.g. the official Playwright MCP): operates on the page's accessibility tree by default and returns a structured snapshot (roles, names, refs, text) rather than pixels. This means the cheap, safe path is the default — request a screenshot only when pixels are genuinely required, and keep it viewport-scoped. The MCP typically holds one persistent browser across calls, so the leak risk shifts to *contexts/sessions left open between calls*: close or recycle them explicitly.
- **Direct Playwright / Puppeteer**: you write every call, so no guard is applied for you. Every Hard Rule must be explicit in your code — the launch count, the timeouts, the teardown, the screenshot mode. Nothing defaults to safe.

## Concurrency budget (by available RAM)

**Always start at 5–10 concurrent units, whatever the ceiling; measure free memory; then grow.** A number that "should fit" on paper still thrashes once each unit loads a heavy SPA. The table below is measured *ceilings* to grow toward — not starting points.

Two distinct topologies; do not confuse their limits:

| Available RAM | Contexts in ONE browser (single run) | Independent agent processes (a browser each) |
|---|---|---|
| 8 GB | ~20–30 | ~3–5 |
| 16 GB | ~40–60 | ~6–8 |
| 32 GB (VM) | ~80–120 | ~15–20 |

Below 8 GB, treat 5–10 contexts as the ceiling, not just the start. Between rows, interpolate linearly and re-measure. A context costs ~20–50 MB; a browser process costs hundreds of MB — which is why the single-run rule (one browser, many contexts) scales far higher than launching a browser per unit.

## Teardown patterns

- **Direct**: wrap the run so `context.close()` / `browser.close()` execute on every exit path — success, thrown error, and early return. Do not rely on process exit to reclaim a browser; orphaned headless Chrome blocks the next launch (busy profile / port) and leaks processes in orchestrator loops.
- **MCP**: close or recycle the browser session/context the server holds when the task ends; do not leave sessions alive between unrelated calls.
- **Long or repeated jobs**: recycle the context between work units (fresh context, same browser instance) to shed accumulated memory — a single context that lives for the whole run grows unbounded, which is the resource-safety concern here.
- **On teardown failure**: if a process refuses to die or a profile cannot be released, surface the PID/path so the caller can clean up before the next run — a silent leak reads as a healthy exit.
