import { parseArgs } from 'node:util';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify as yamlStringify } from 'yaml';

import { parse, ParseError } from './parse.js';
import { validate, ValidationError } from './validate.js';
import { FIELD_REGISTRY } from './registry/field-registry.js';
import { stripFields } from './adapters/adapter.js';
import { claudeAdapter } from './adapters/claude.js';
import { opencodeAdapter } from './adapters/opencode.js';
import { installSkill } from './install.js';
import type { Adapter } from './adapters/adapter.js';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    target:    { type: 'string'  },
  },
  strict: true,
  allowPositionals: false,
});

const dryRun = flags['dry-run'] as boolean;
const targetFlag = flags['target'] as string | undefined;

// One token per build invocation. Namespaces backups so installs within the
// same run (including the same skill across two adapters) never collide.
const runId = `${Date.now()}-${process.pid}`;

// ---------------------------------------------------------------------------
// Adapter selection
// ---------------------------------------------------------------------------

const ALL_ADAPTERS: readonly Adapter[] = [claudeAdapter, opencodeAdapter];

function selectAdapters(): Adapter[] {
  if (!targetFlag) return [...ALL_ADAPTERS];

  if (targetFlag === 'claude') return [claudeAdapter];
  if (targetFlag === 'opencode') return [opencodeAdapter];

  console.error(`Error: unknown --target "${targetFlag}". Valid values: claude, opencode`);
  process.exit(1);
}

const adapters = selectAdapters();

// ---------------------------------------------------------------------------
// Skill discovery
// ---------------------------------------------------------------------------
// Looks for skills/*/SKILL.md relative to the repo root.
// The repo root is the parent of the directory that contains this script.

const __filename = fileURLToPath(import.meta.url);
// __filename = <repo>/dist/build.js  →  repoRoot = <repo>
const repoRoot = resolve(__filename, '../../');
const skillsDir = join(repoRoot, 'skills');

function discoverSkills(): Array<{ name: string; sourcePath: string }> {
  if (!existsSync(skillsDir)) {
    console.error(`Error: skills directory not found at ${skillsDir}`);
    process.exit(1);
  }

  const entries = readdirSync(skillsDir, { withFileTypes: true });
  const skills = entries
    .filter((e) => e.isDirectory())
    .map((e) => ({
      name: e.name,
      sourcePath: join(skillsDir, e.name, 'SKILL.md'),
    }))
    .filter(({ sourcePath }) => existsSync(sourcePath));

  if (skills.length === 0) {
    console.error(`Error: no skills found in ${skillsDir}. Add at least one skills/<name>/SKILL.md.`);
    process.exit(1);
  }

  return skills;
}

// ---------------------------------------------------------------------------
// Render: strip fields for an adapter, then serialize frontmatter + body
// ---------------------------------------------------------------------------

function renderSkill(
  frontmatter: Record<string, unknown>,
  body: string,
  adapter: Adapter,
): string {
  const stripped = stripFields(frontmatter, adapter, FIELD_REGISTRY);
  const yamlText = yamlStringify(stripped).trimEnd();
  // Reconstruct: ---\n<yaml>\n---\n<body>
  return `---\n${yamlText}\n---\n${body}`;
}

// ---------------------------------------------------------------------------
// Build loop
// ---------------------------------------------------------------------------

interface SkillFailure {
  name: string;
  adapter?: string;
  error: string;
}

const failures: SkillFailure[] = [];
const skills = discoverSkills();

console.log(`\nskillkit build${dryRun ? ' (dry-run)' : ''} — ${skills.length} skill(s), ${adapters.length} adapter(s)\n`);

for (const { name, sourcePath } of skills) {
  console.log(`[${name}]`);

  // Parse
  let parsed: ReturnType<typeof parse>;
  try {
    const raw = readFileSync(sourcePath, 'utf8');
    parsed = parse(raw);
  } catch (err) {
    const msg = err instanceof ParseError ? err.message : String(err);
    console.error(`  PARSE ERROR: ${msg}`);
    failures.push({ name, error: msg });
    continue; // next skill
  }

  // Validate
  try {
    validate(parsed.frontmatter);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error(`  VALIDATION ERRORS (${err.failures.length}):`);
      for (const f of err.failures) {
        console.error(`    - ${f.field}: ${f.message}`);
      }
    } else {
      console.error(`  VALIDATION ERROR: ${String(err)}`);
    }
    failures.push({ name, error: err instanceof Error ? err.message : String(err) });
    continue; // no adapter runs for a failed skill
  }

  // For each selected adapter: strip → render → install.
  // If one adapter fails for this skill, abort the remaining adapters for the
  // SAME skill — rollback is per-installSkill call, so continuing would leave
  // the skill half-installed across roots with no cross-adapter rollback.
  for (const adapter of adapters) {
    let destPath: string;
    try {
      destPath = adapter.resolveInstallPath(name);
    } catch (err) {
      const msg = String(err);
      console.error(`  INSTALL ERROR [${adapter.agent}]: ${msg}`);
      failures.push({ name, adapter: adapter.agent, error: msg });
      break; // bad name affects all adapters for this skill
    }
    try {
      const rendered = renderSkill(parsed.frontmatter, parsed.body, adapter);
      installSkill(rendered, destPath, dryRun, undefined, runId);
    } catch (err) {
      const msg = String(err);
      console.error(`  INSTALL ERROR [${adapter.agent}]: ${msg}`);
      failures.push({ name, adapter: adapter.agent, error: msg });
      console.error(`  Aborting remaining adapters for [${name}] to avoid a half-installed state.`);
      break; // stop other adapters for this skill
    }
  }
}

// ---------------------------------------------------------------------------
// Summary + exit code
// ---------------------------------------------------------------------------

console.log();

if (failures.length === 0) {
  console.log('Build complete. All skills processed successfully.');
  process.exit(0);
} else {
  console.error(`Build finished with ${failures.length} failure(s):`);
  for (const f of failures) {
    const adapterTag = f.adapter ? ` [${f.adapter}]` : '';
    console.error(`  - ${f.name}${adapterTag}: ${f.error}`);
  }
  process.exit(1);
}
