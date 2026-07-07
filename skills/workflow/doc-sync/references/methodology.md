# doc-sync methodology

Detail the SKILL.md defers. Load when a call needs the full dial, extraction patterns, or the `Needs-decision` rationalizations.

## The audience dial in full

Audience is the discriminator because the SAME code-vs-doc contradiction demands opposite actions depending on who reads the doc.

Worked example — a function grew from 3 to 4 parameters; a doc says "takes 3 arguments":

- The doc is `AGENTS.md` → patch to 4. An agent that reads "3" calls the function wrong. No hesitation.
- The doc is an ADR: *"the signature takes 3 args to force the builder pattern"* → STOP. That is a narrated decision. The 4th param may VIOLATE the decision — the drift could be the code, not the doc. `Needs-decision`, never a silent rewrite.

Same signal, opposite action. The reader decides.

| | Agent-facing | Human-facing |
|---|---|---|
| What drift means | operational lie — misdirects execution | lost understanding — misleads a reader |
| Default action | patch the false claim | patch only pure facts; escalate anything touching WHY |
| Anti-filler gate | rarely fires (docs are mostly WHAT/HOW) | central (docs carry WHY) |
| `Needs-decision` | rare | frequent |
| Regenerable? | closer to yes | no — human authorship, protect it |

## Claim extraction per doc type

A *claim* is a verifiable assertion the code can confirm or falsify. A *WHY* is intention the code cannot show — never a claim to verify.

| Doc type | Claims to verify | WHY to protect |
|----------|------------------|----------------|
| README | install/run commands, prerequisites, file paths, script names | why the project exists, design stance |
| API / reference | signatures, params, return types, flags, endpoints | why an interface is shaped this way |
| ADR | the decision's *current* mechanics (paths, names it cites) | the decision, alternatives rejected, tradeoffs |
| Agent instructions (e.g. AGENTS.md, CLAUDE.md, editor rules) | build/test commands, conventions, paths, tool names | rare — mostly operational |
| Tutorial / guide | steps that run, outputs shown, versions | the teaching arc, why an order was chosen |

Extract claims. Leave WHY passages untouched — unconditionally. A falsifiable token living inside a WHY sentence routes to `Needs-decision`, never an in-place edit; patching it to fit the code is exactly the trap below (line 50). Only patch facts in claim-only sentences fully separable from WHY prose.

## The surprise test applied to prose

Same bar as `clean-comments`: a sentence earns its place only if a reader would be SURPRISED to lose it. When syncing, this cuts two ways:

- Do not ADD restatement — patching a claim does not license padding around it.
- Do not DELETE a passage that survives the surprise test just because the code moved — that passage may be the WHY.

## `Needs-decision` — the rationalizations that signal a skipped WHY

Route to `Needs-decision` — do NOT edit — when you catch yourself thinking:

- "The code is newer, so the doc must be wrong." (Maybe the code drifted from the documented decision.)
- "I'll just update the rationale to match the new code." (Rewriting a WHY to fit code erases why the code was supposed to differ.)
- "This ADR is old, it's probably stale." (Age is not contradiction. Verify the cited facts; leave the reasoning.)
- "I can't tell if the doc or the code is right, but I'll pick one." (That uncertainty IS the `Needs-decision`. Report both sides.)

State: what the doc says, what the code does, why they conflict, and a recommended next move. Edit nothing.
