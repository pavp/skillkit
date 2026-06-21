import type { FieldRegistry } from '../registry/field-registry.js';

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------
// Each supported agent (Claude Code, OpenCode) implements this interface.
// Adapters are pure value objects — they carry no mutable state.

export interface Adapter {
  /** Agent identifier — used for scope filtering in the field registry. */
  readonly agent: 'claude' | 'opencode';

  /**
   * Returns the absolute install path for a skill by name.
   * The returned path MUST end with `SKILL.md`.
   * `~` is expanded to os.homedir() — callers MUST NOT expand it again.
   */
  resolveInstallPath(name: string): string;
}

// ---------------------------------------------------------------------------
// assertValidSkillName()
// ---------------------------------------------------------------------------
// Defense-in-depth: a skill name flows from a source directory name into
// resolveInstallPath. A name containing a path separator, `..`, or a leading
// dot could escape or distort the install path. The install-step safety guard
// is the last line of defense; this rejects bad names at the adapter boundary,
// which OWNS the name→path mapping, with a clear error.

export function assertValidSkillName(name: string): void {
  if (
    name.length === 0 ||
    name === '.' ||
    name === '..' ||
    name.startsWith('.') ||
    /[/\\]/.test(name) ||
    name.includes('..')
  ) {
    throw new Error(
      `Invalid skill name "${name}": must not be empty, start with a dot, ` +
      `contain a path separator, or contain "..".`,
    );
  }
}

// ---------------------------------------------------------------------------
// stripFields()
// ---------------------------------------------------------------------------
// Shared field-filtering engine used by all adapters.
//
// Keep a field when:
//   registry[field].scope === 'universal'   (present on every agent)
//   registry[field].scope === adapter.agent (this adapter's exclusive fields)
//
// Unknown fields (not in registry) are always stripped — additive safety.

export function stripFields(
  frontmatter: Record<string, unknown>,
  adapter: Adapter,
  registry: FieldRegistry,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(frontmatter)) {
    const def = registry[key as keyof FieldRegistry];
    if (!def) {
      // Unknown field — strip silently.
      continue;
    }
    if (def.scope === 'universal' || def.scope === adapter.agent) {
      out[key] = value;
    }
    // else: field is scoped to a different agent — strip.
  }

  return out;
}
