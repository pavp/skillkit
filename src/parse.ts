import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedSkill {
  /** Parsed frontmatter fields (YAML between the opening and closing ---). */
  frontmatter: Record<string, unknown>;
  /** Markdown body — byte-for-byte from the source; no adapter may modify it. */
  body: string;
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly line: number,
  ) {
    super(`ParseError (line ${line}): ${message}`);
    this.name = 'ParseError';
  }
}

// ---------------------------------------------------------------------------
// parse()
// ---------------------------------------------------------------------------
// Splits raw SKILL.md content at `---` delimiters into frontmatter + body.
//
// Expected format:
//   ---
//   <yaml frontmatter>
//   ---
//   <markdown body>
//
// Rules:
// - The opening `---` MUST be on line 1 (first line of the file).
//   Throws ParseError(line=1) if absent.
// - The closing `---` MUST exist. Throws ParseError with the line of EOF if absent.
// - Body is everything after the closing `---\n` — byte-for-byte, no trimming.

export function parse(raw: string): ParsedSkill {
  const lines = raw.split('\n');

  // Opening --- must be line 1 (index 0).
  if (lines[0]?.trimEnd() !== '---') {
    throw new ParseError('SKILL.md must start with "---" (opening frontmatter delimiter)', 1);
  }

  // Find the closing --- (first occurrence after line 1).
  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trimEnd() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    throw new ParseError(
      'SKILL.md is missing the closing "---" (end of frontmatter delimiter)',
      lines.length,
    );
  }

  const yamlText = lines.slice(1, closingIndex).join('\n');
  // Body starts after the closing --- line; preserve trailing newline exactly.
  const bodyLines = lines.slice(closingIndex + 1);
  // Re-join with \n — same as the original split, so the result is byte-for-byte.
  const body = bodyLines.join('\n');

  const parsed = parseYaml(yamlText) as Record<string, unknown> | null;
  const frontmatter: Record<string, unknown> = parsed ?? {};

  return { frontmatter, body };
}
