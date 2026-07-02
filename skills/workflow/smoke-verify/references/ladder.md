# Smoke Verify — The Ladder

Cheapest signal first. A rung runs only if it applies to the stack and fits the remaining time budget.

## Rungs

1. **Compiles/validates** — build, typecheck, or syntax check. Cheapest proof the code is well-formed.
2. **Fast existing tests** — the quick slice of the project's own suite (unit tests, a tagged smoke subset). Only what already exists; never author tests here.
3. **Boots** — the process starts: server listens, CLI answers a trivial invocation, worker connects. A startup crash is the highest-value cheap signal after tests.
4. **Functional probe** — touch the key flow once: hit the main endpoint, invoke the target function, load the main page. One happy path, not a suite.

## Discovery sources (in order)

1. Project manifests and scripts — task runners, build files, package scripts.
2. CI config — workflow files show exactly how the project verifies itself.
3. README / contributing docs.
4. Installed dev tooling — which test runner or builder is actually present.

Pick the fastest applicable command per rung. When several exist, prefer the one CI runs.

## Target trimming

With a named target (feature, module, function, endpoint):

- Rung 1: compile only what covers the target when the stack allows scoping; otherwise full (usually still cheap).
- Rung 2: only the tests near the target — its module, package, or path.
- Rung 3: boot only if the target needs a running process.
- Rung 4: probe THE target flow, nothing else.

## Browser automation gate

Use browser automation (e.g. an installed Playwright) for rung 4 only when BOTH hold:

- the target is a web UI flow, and
- the tooling is already installed in the project (dependency present, browsers provisioned).

Never install or provision it. When the UI can be probed cheaper (an HTTP request to the page or endpoint), prefer that.

## Time budget

Whole run: minutes, not tens of minutes. Guideline: ~5 minutes for project scope, ~2 minutes for a named target, unless the caller grants more. A rung that would clearly exceed the remaining budget (a 20-minute build) is `skipped` with reason `over time budget`. A skipped rung is honest; a blown budget defeats the skill's purpose.

## INCONCLUSIVE vs FAIL

- **FAIL**: a rung ran and showed breakage.
- **INCONCLUSIVE**: could not determine how to verify — no manifests, unknown stack, undiscoverable commands, or every rung inapplicable/over budget. Report what was tried in `inconclusive_reason`.
- Never convert uncertainty into FAIL: an unverifiable project is not a broken project.
