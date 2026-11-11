---
name: pr-description
description: "Writes the description of your own PR: fills the repo's PR template (or its own), always carries evidence (before/after when one exists), says what went unverified, invents nothing. Use whenever a PR is about to be opened or its body updated: 'open the PR', 'write the PR description', 'fill the template', 'update the PR body'. Proving it works → verify-before-pr; comments → pr-comments."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.7.1
---

## Activation Contract

Load when the description of a PR for the user's own change is about to be written, filled, or updated: opening the PR, "write the description", a template to fill, a body gone stale after new commits.

Do NOT load to prove the change works (→ `verify-before-pr`), to comment on a PR (→ `pr-comments`), or to read someone else's PR (→ `pr-map`).

## Hard Rules

- **Never invent.** A number, a result, "tested", or a ticked checkbox appears only when you observed it or the evidence package states it. Anything else goes under Not verified, never into a claim.
- **Evidence is always there**, in any template: before and after for a change to existing behavior, after alone for something new. Its source is verify-before-pr's `pr-block.md`, presented per Evidence shape between its markers: built only from that block, never from `evidence.md` or the session; every number, command, output and media reference it posts copied literally; verdicts become the plain results of Evidence shape; only order, layout and that wording change. No usable block → the evidence gate decides; never write a "before" you did not observe, nor one for something that did not exist.
- **Not verified is always there**, holding only what a reviewer can act on: a check that did not run and where it would. Collect it from the block's `Not verified` line plus every check this session skipped or could not run; drop notes about the checking process itself (a new test that cannot load on the base). Nothing → `None`.
- **Lead with the problem.** The first paragraph says what was wrong or missing, for whom, and how it showed up. Changes are grouped by area, never a list of commits.
- **A repo template wins.** Keep its sections, order, and wording, and never move, merge or reorder a section: the evidence goes inside the template's own evidence section wherever it stands, even last, with its markers; do what its comments ask (delete options that do not apply, ask for a ticket) and remove the comments once done. Add only what it lacks of Evidence and Not verified: into its evidence section (screenshots, demo, evidence, testing), else a `## 🔍 Evidence` section right after its summary, before its changes. A missing Not verified goes right after the evidence. Never add sections it did not ask for beyond these.
- **Ask, never guess, a ticket** the template has a slot for and nothing you read names (the ask, the branch, commits, the evidence block); the user says there is none → the template's convention, else `NO-TICKET`. Never leave a placeholder in the draft.
- **Name the check, never the tooling.** Nothing published names a skill, agent, model, prompt or workflow, nor its private terms (walk, package, round, pr-block): say what was checked (`the before/after check did not run: nothing runs differently`). Only a change to that tooling itself names it.
- **A security fix states impact only**: no reproduction, payload, input, or path that triggers it.
- **No attribution footer** ("Generated with…", AI co-author lines) unless the template asks for one.
- **Updating an open PR**: read its current description first; keep what a person wrote that still holds, replace what the new commits made stale, and swap only the content between the evidence markers, rebuilt from the package every time, never kept from the published text; an old `<!-- verify-before-pr:start -->`…`end` pair counts as them and is replaced by the current pair. Never wipe it.
- **Publish only the description.** Never push, rebase, or merge; a branch missing on the remote → ask before anything else.
- **Media are never replaced by words.** Before publishing a block with media, check the forge can upload them (Commands); it cannot → do not publish: name the media, the blocker and the command to run where upload works, and STOP. Never drop a medium or write `screenshots` in its place.
- **Language**: the one the repo's template and recent PRs use; none → English.

## Decision Gates

Template — first that answers (Commands lists where to look):

| Found | Use |
|---|---|
| One template in the repo | That template |
| Several | Ask which one; never merge them |
| None | `assets/pr-template.md` |

Evidence for this tree:

The package lives inside the git directory, which file search tools skip: list it with `ls "$(git rev-parse --git-dir)/evidence/<branch>"`, branch slashes turned into `-`, one folder per short tree hash.

| Found | Action |
|---|---|
| A `pr-block.md` for this tree whose verdict is FAIL | No description: name each failing criterion and what it showed, say the change goes back to whoever builds, and STOP |
| A `pr-block.md` whose recorded tree equals `git rev-parse HEAD^{tree}` | Present it between the markers per Evidence shape |
| A package for an earlier tree of this branch, and nothing runs differently in the commits since (docs, comments, formatting, tooling config) | Present it; Not verified names those commits and that they change no behavior |
| A package for another tree | Stale: never publish it; load `verify-before-pr` and run it again |
| No package, and nothing runs differently after the change (docs, comments, formatting, tooling config; never text an agent follows) | Evidence from what you observed this session, in the evidence section outside the markers, which stay empty; Not verified says the before/after check did not run and why |
| No package, `verify-before-pr` installed | Load it and run it first, then come back |
| No package, not installed | Evidence from what you observed running this session, same input on both sides when there is a before; nothing observed → the section says so and Not verified names it |

Evidence shape, from `pr-block.md`, between exactly one pair of `<!-- evidence:start -->` and `<!-- evidence:end -->`, in this order; nothing else from the block is posted, its own marker lines (old or new) included:

1. One line of facts, never a verdict word (READY, READY WITH GAPS, UNVERIFIED): where it was checked, what was compared with the short commit, and the counts, leaving out a zero, never who did the checking (`Checked on the running app, `main` vs `2d8cc56`: 2 of 3 criteria behave as asked; 1 could not be checked locally.`).
2. A table `| Criterion | Before | After | Result |`, one row per criterion with something to run; a criterion with nothing to run (code structure, naming, file layout) is no row but a Not verified item; Result in words: PASS → `✅ as asked`, plus `, same result twice` when it was run twice; FAIL → `❌ not as asked`; NOT WALKABLE → `⚠️ not checked: <reason>`; BLOCKED → `⛔ not checked: <what was missing>`. A criterion from a review comment carries the comment's link in its cell. A cell keeps all its text, qualifiers included (`no flaky query`), except a command moved to `How:`. A cell with media holds one medium and nothing else, no comparison metric beside it (`pixel diff ≤ 0.1%` stays in the package); the block's `↳` rows (one per screen, one `↳ video`) stay under their criterion, whose own row then holds only its result: a medium on it moves to a `↳ <screen>` row of its own. An alt text that does not name its side gets ` before` or ` after`, and a bare count gets the unit its criterion names (`data-testid` → `61 ids`), the number itself unchanged. After upload each image in the table is `<img src="<url>" alt="<alt>" width="320">`, so all share one size; a video stays the `[<what it shows>](<url>)` link the upload wrote, alone in its cell, where GitHub plays it (its size cannot be set). Never a video line under the table, nor a `#<n>` label.
3. The block's `Since the last review` line, when it has one, copied literally.
4. `How:` on one line, only when the same command repeats across rows: each command written once, as short clauses joined by `;`; never to explain what a cell already says.

Diff checks are never posted: Changes names a replaced test or a new dependency under its area, read from the diff.

The block's `Not verified` line goes to the Not verified section. The record (branch, full SHA, base SHA, tree, date, source, isolation, overall verdict) stays in the package for the tree check, never in the PR. An UNVERIFIED verdict becomes a Not verified item saying in plain words why the check was not independent (criteria from the author's own plan, or checked by the session that wrote the code).

Publish:

| The request | Action |
|---|---|
| Says to open, create, or update the PR | Publish, then read back |
| Asks only for the description | Show the draft and the command; STOP |

## Execution Steps

1. Find the template per the gate; read the title convention (template comments, CONTRIBUTING, recent merged PR titles); none → a Conventional Commit title.
2. Resolve the evidence per the gate; read the PR's target branch from the block (`against <target>`), else the user, else the default branch.
3. Gather facts from the user's ask, the ticket, the diff (`git diff <target>...HEAD --stat`, then the diff), and the evidence package: problem, changes by area, type, what is left out.
4. Fill each template section where it stands, top to bottom, never reordering: the problem in its summary, the evidence block with its markers in its evidence section, Not verified after it, the changes, the checklist ticked only where true. Details (trade-offs, migrations, what did not work, what is left) only when a reviewer needs them; nothing to say → delete that section, never fill it with `None`. ELI5 goes in when the template has a slot for it, or with the own template: two or three plain sentences someone outside the project would follow.
5. A slice of a stack: the summary names the PR it builds on (`Builds on #<n>`) when that PR exists, and the PR targets that slice's branch.
6. Publish or show per the gate. Publishing, in two passes: from the evidence folder, publish with every medium attached and written `![<alt>](./<file>)`, never `<img src="./…">`, which the upload does not rewrite, so each `./` reference becomes its URL; then read the body back, turn each image of the evidence table into its `<img … width="320">`, and update the body once more with nothing attached. Then read the description back.

## Output Contract

The draft: a title line, then the description, then the command that publishes it.

After publishing, reply with the PR URL and the read-back, each observed: evidence markers present · every criterion's before, after and result, the `Since the last review` line, and every command and media reference in `pr-block.md` found literally in the published description, checked one by one with a search, never by eye (a `\|` escaped for a table matches `|` outside it) · no `./` reference left · every image or video URL loads, every table image has `width="320"`, and every video renders as a player, never a bare link (the rendered body holds one `<video>` per video) · placeholders and template comments gone. A failed check → say which and fix it with one update, never claim it done.

| Capability | GitHub (`gh`) | Run |
|---|---|---|
| Find the template | `.github/pull_request_template.md`, `pull_request_template.md`, `docs/pull_request_template.md` (any case), or a `.github/PULL_REQUEST_TEMPLATE/` directory | yes, read-only |
| Recent title convention | `gh pr list --state merged --limit 10 --json title` | yes, read-only |
| Open the PR | `gh pr create --base <target> --title <title> --body-file <description.md> --attach './<file>#<alt>' …` | only per the publish gate |
| Update an open PR | `gh pr view <n> --json body`, then `gh pr edit <n> --body-file <description.md> --attach './<file>#<alt>' …` | only per the publish gate |
| Check upload support | `gh pr edit --help` lists `--attach` | yes, read-only |
| Read back | `gh pr view <n> --json body,url`; rendered: `gh api -H "Accept: application/vnd.github.html+json" repos/{owner}/{repo}/pulls/<n> -q .body_html` | yes, after publishing |

## References

- `assets/pr-template.md`: the template used when the repo has none.
