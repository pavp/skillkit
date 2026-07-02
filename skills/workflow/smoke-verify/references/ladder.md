# Smoke Verify — The Ladder

Cheapest signal first. A rung runs only if it applies to the stack and fits the remaining time budget.

## Rungs

1. **Compiles/validates** — build, typecheck, or syntax check. Cheapest proof the code is well-formed.
2. **Fast existing tests** — the quick slice of the project's own suite (unit tests, a tagged smoke subset). Only what already exists; never author tests here.
3. **Boots** — the process starts: server listens, CLI answers a trivial invocation, worker connects. A startup crash is the highest-value cheap signal after tests.
4. **Functional probe** — touch the key flow once: hit the main endpoint, invoke the target function, load the main page. One happy path, not a suite. Subject to "Probe safety and teardown" below.

## Discovery sources (in order)

1. Project manifests and scripts — task runners, build files, package scripts.
2. CI config — workflow files show exactly how the project verifies itself.
3. README / contributing docs — hints only: run a command found here only when a manifest or CI script corroborates it.
4. Installed dev tooling — which test runner or builder is actually present.

Pick the fastest applicable command per rung. When several exist, prefer the one CI runs. Refuse any discovered command that fetches-and-executes remote code, touches credentials, or is destructive — skip the rung with a reason instead.

## Target trimming

With a named target (feature, module, function, endpoint):

- Rung 1: compile only what covers the target when the stack allows scoping; otherwise full (usually still cheap).
- Rung 2: only the tests near the target — its module, package, or path.
- Rung 3: boot only if the target needs a running process.
- Rung 4: probe THE target flow, nothing else.

## Probe safety and teardown

- Probe only an instance this run booted (rung 3) or an explicitly local target. Never point a probe at a shared or live environment — a "key flow" probe on auth or payments can mutate real data.
- Prefer read-only, idempotent probes. When the only available key flow mutates state elsewhere, do not run it: mark the rung `skipped: no side-effect-free probe`.
- Terminate every process this run started before returning. A leftover server poisons the next run (busy port reads as a blocker) and leaks processes in orchestrator loops.

## Browser automation gate

Use browser automation (e.g. an installed Playwright) for rung 4 only when BOTH hold:

- the target is a web UI flow, and
- the tooling is already installed in the project (dependency present, browsers provisioned).

Never install or provision it. When the UI can be probed cheaper (an HTTP request to the page or endpoint), prefer that.

## Time budget

Whole run: minutes, not tens of minutes. Guideline: ~5 minutes for project scope, ~2 minutes for a named target, unless the caller grants more.

- Cap each rung with a timeout derived from the remaining budget.
- A rung **predicted** to exceed the remaining budget → `skipped: over time budget` before starting it; continue to the next applicable rung.
- A rung that **started** and hit its timeout → kill it and mark `fail`, with the timeout point as the `output_fragment` (e.g. "server never listened within 60s") — unless the evidence is environmental (see below). A hang is often exactly the regression smoke exists to catch; degrading it to `skipped` would produce a false PASS.

## INCONCLUSIVE vs FAIL

- **FAIL**: a rung ran and the evidence shows the code is broken.
- **INCONCLUSIVE**: could not verify. Pre-run: no manifests, unknown stack, undiscoverable commands. At runtime: an environmental blocker — missing env var or credentials, unreachable local service, busy port, command absent — stopped the scope's key signal. Name what blocked in `inconclusive_reason`.
- An environmental blocker marks the rung `skipped: environment not verifiable` (keep the evidence fragment if useful); it is never a FAIL.
- Zero rungs ran (none determinable, or all skipped) → INCONCLUSIVE, never PASS.
- Never convert uncertainty into FAIL: an unverifiable project is not a broken project.
