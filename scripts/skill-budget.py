#!/usr/bin/env python3
"""Measure SKILL.md body size against the AGENTS.md token budget.

Usage:
    scripts/skill-budget.py                     # every skill, sorted by size
    scripts/skill-budget.py skills/qa/qa-manual # one skill, with a section breakdown
    scripts/skill-budget.py --check             # exit 1 if any skill exceeds the hard max

Counts the body only: frontmatter is metadata, not runtime instructions.

Without tiktoken installed this falls back to a heuristic calibrated against
cl100k_base over this repo's skills. It is tuned to never report fewer tokens
than the real count (up to 11% over), so a skill that reports under the max is
genuinely under it. `pip install tiktoken` for exact counts.
"""

import argparse
import re
import statistics
import sys
from pathlib import Path

TARGET_LOW, TARGET_HIGH, HARD_MAX = 400, 1200, 5000

# Tokens per regex piece, set to the highest ratio observed across this repo's
# skills so the estimate never lands under the real count.
HEURISTIC_CALIBRATION = 1.0068

try:
    import tiktoken

    _ENC = tiktoken.get_encoding("cl100k_base")
except Exception:
    _ENC = None


def count(text):
    if _ENC:
        return len(_ENC.encode(text))
    pieces = re.findall(r"[A-Za-z]+|\d|[^\sA-Za-z\d]", text)
    return round(len(pieces) * HEURISTIC_CALIBRATION)


def body_of(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return text
    parts = text.split("---", 2)
    return parts[2] if len(parts) > 2 else text


def verdict(tokens):
    if tokens > HARD_MAX:
        return "OVER", "exceeds hard max"
    if tokens > TARGET_HIGH:
        return "WIDE", "over target, under max"
    if tokens < TARGET_LOW:
        return "THIN", "under target"
    return "OK", ""


def find_skills(roots):
    if not roots:
        return sorted(Path("skills").glob("*/*/SKILL.md"))
    found = []
    for root in roots:
        p = Path(root)
        if p.is_dir():
            found.extend(sorted(p.glob("**/SKILL.md")))
        elif p.name == "SKILL.md":
            found.append(p)
        else:
            sys.exit(f"not a skill or directory: {root}")
    return found


def sections(body):
    for chunk in re.split(r"\n(?=## )", body):
        if chunk.strip():
            yield chunk.strip().split("\n")[0].lstrip("# ").strip(), count(chunk)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*", help="skill dirs or SKILL.md files (default: all)")
    ap.add_argument("--check", action="store_true", help="exit 1 if any skill exceeds the hard max")
    args = ap.parse_args()

    skills = find_skills(args.paths)
    if not skills:
        sys.exit("no SKILL.md found")

    rows = [(p, count(body_of(p))) for p in skills]
    rows.sort(key=lambda r: -r[1])

    engine = "tiktoken cl100k_base" if _ENC else "heuristic (never under, up to 11% over)"
    print(f"budget: target {TARGET_LOW}-{TARGET_HIGH}, hard max {HARD_MAX}  |  counting: {engine}\n")

    width = max(len(p.parent.name) for p, _ in rows)
    for path, tokens in rows:
        state, note = verdict(tokens)
        bar = "" if not note else f"  ({note})"
        print(f"{state:5} {tokens:5d}  {path.parent.name:{width}}{bar}")

    if len(rows) == 1:
        print()
        for name, tokens in sections(body_of(rows[0][0])):
            print(f"      {tokens:5d}  {name}")

    over = [p.parent.name for p, t in rows if t > HARD_MAX]
    if len(rows) > 1:
        counts = [t for _, t in rows]
        print(f"\n{len(rows)} skills | median {int(statistics.median(counts))} | max {max(counts)} | over max: {len(over)}")

    if args.check and over:
        print(f"\nFAIL: over the {HARD_MAX} hard max: {', '.join(over)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
