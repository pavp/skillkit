import { homedir } from 'node:os';
import {
  existsSync,
  lstatSync,
  realpathSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Known install roots
// ---------------------------------------------------------------------------
// installSkill() MUST NOT write outside these paths.
// Expand ~ so all comparisons use absolute paths.

const INSTALL_ROOTS: readonly string[] = [
  join(homedir(), '.claude', 'skills'),
  join(homedir(), '.config', 'opencode', 'skills'),
];

function isUnderKnownRoot(absPath: string): boolean {
  return INSTALL_ROOTS.some((root) => absPath.startsWith(root + '/') || absPath === root);
}

// ---------------------------------------------------------------------------
// Symlink defense
// ---------------------------------------------------------------------------
// The known-root check above is lexical only. A symlinked install root, parent
// dir, or existing skill dir would let mkdir/copy/write/rename follow the link
// and escape the intended tree — clobbering an unrelated target. To enforce the
// containment guarantee PHYSICALLY, resolve the longest EXISTING prefix of the
// target path to its real location and re-check it is still under a known root.
// Any symlinked segment in that prefix is rejected outright.

function longestExistingPrefix(absPath: string): string {
  let current = absPath;
  while (current !== dirname(current)) {
    if (existsSync(current)) return current;
    current = dirname(current);
  }
  return current;
}

function assertNoSymlinkEscape(destPath: string): void {
  const prefix = longestExistingPrefix(destPath);
  if (!existsSync(prefix)) return; // nothing exists yet — nothing to follow

  // Reject if any existing segment up to the prefix is a symlink.
  let segment = prefix;
  while (segment !== dirname(segment)) {
    if (existsSync(segment) && lstatSync(segment).isSymbolicLink()) {
      throw new Error(
        `installSkill: refusing to write through symlinked path segment "${segment}".`,
      );
    }
    segment = dirname(segment);
  }

  // Re-check that the real (symlink-resolved) prefix is still under a known root.
  const realPrefix = realpathSync(prefix);
  if (!isUnderKnownRoot(realPrefix) && !INSTALL_ROOTS.some((r) => realPrefix === dirname(r) || r.startsWith(realPrefix + '/'))) {
    throw new Error(
      `installSkill: real path "${realPrefix}" resolves outside known install roots.`,
    );
  }
}

// ---------------------------------------------------------------------------
// installSkill()
// ---------------------------------------------------------------------------
// Installs rendered skill content to destPath (absolute, produced by an Adapter).
//
// Parameters:
//   renderedContent  — full SKILL.md text (frontmatter + body)
//   destPath         — absolute destination (from Adapter.resolveInstallPath)
//   dryRun           — when true, only logs intent; zero FS mutation
//   backupRootDir    — root dir for backups (default: ~/.skillkit/backups)
//   runId            — per-run token; namespaces backups so concurrent installs
//                      in the same run never collide. Defaults to a per-process,
//                      monotonically increasing token.
//
// Dry-run: logs WOULD-CREATE or WOULD-OVERWRITE destPath; returns immediately.
//
// Real run (atomic):
//   1. Safety guard — throws if destPath is outside INSTALL_ROOTS (lexical + symlink).
//   2. mkdir -p the destination directory.
//   3. If destPath already exists: copy it to
//      backupRootDir/{runId}/{agent}/{skillName}/SKILL.md (separate dir — NOT sibling,
//      namespaced by agent so the same skill backed up for two adapters never collides).
//   4. Write to a temp file in the same destination dir.
//   5. fs.renameSync(tmp, dest) — atomic on POSIX.
//
// Error recovery:
//   On any error after backups have been taken:
//   - restore every backed-up file to its original location (atomic rename back)
//   - remove every directory this call created
//   - remove any orphaned temp file
//   - re-throw the original error; if restore itself fails, throw an aggregate
//     error naming the files left unrestored so the user knows recovery is partial.

const DEFAULT_BACKUP_ROOT = join(homedir(), '.skillkit', 'backups');

export function installSkill(
  renderedContent: string,
  destPath: string,
  dryRun: boolean,
  backupRootDir: string = DEFAULT_BACKUP_ROOT,
  runId: string = String(process.pid),
): void {
  // Normalize first so the guard reasons about the canonical path, not a
  // caller-supplied string that might contain `..` segments.
  destPath = resolve(destPath);

  // -------------------------------------------------------------------------
  // Safety guard (always, even in dry-run for early feedback)
  // -------------------------------------------------------------------------
  if (!isUnderKnownRoot(destPath)) {
    throw new Error(
      `installSkill: destPath "${destPath}" is outside known install roots.\n` +
      `Known roots:\n${INSTALL_ROOTS.map((r) => `  ${r}`).join('\n')}`,
    );
  }

  // -------------------------------------------------------------------------
  // Dry-run — zero FS mutation
  // -------------------------------------------------------------------------
  if (dryRun) {
    const verb = existsSync(destPath) ? 'WOULD-OVERWRITE' : 'WOULD-CREATE';
    console.log(`  ${verb} ${destPath}`);
    return;
  }

  // Physical symlink-escape defense (real runs only — touches the filesystem).
  assertNoSymlinkEscape(destPath);

  // -------------------------------------------------------------------------
  // Real run
  // -------------------------------------------------------------------------

  // Track mutations for rollback.
  const backedUp: Array<{ original: string; backup: string }> = [];
  const createdDirs: string[] = [];
  let tmpPath: string | undefined;

  function ensureDir(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      createdDirs.push(dir);
    }
  }

  function ensureDirQuiet(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  function restore(): string[] {
    const unrestored: string[] = [];
    // Restore backed-up files first (atomic rename back — the backup copy is
    // consumed, but the original location is restored atomically).
    for (const { original, backup } of backedUp) {
      try {
        ensureDirQuiet(dirname(original));
        renameSync(backup, original);
      } catch {
        unrestored.push(original);
        console.error(`  [rollback] failed to restore ${original} from ${backup}`);
      }
    }
    // Remove any orphaned temp file.
    if (tmpPath && existsSync(tmpPath)) {
      try {
        rmSync(tmpPath, { force: true });
      } catch {
        console.error(`  [rollback] failed to remove temp file ${tmpPath}`);
      }
    }
    // Remove dirs this run created (reverse order: children before parents).
    for (const dir of createdDirs.reverse()) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        console.error(`  [rollback] failed to remove dir ${dir}`);
      }
    }
    return unrestored;
  }

  try {
    const destDir = dirname(destPath);

    // Step 1: ensure destination directory exists.
    ensureDir(destDir);

    // Step 2: backup existing file (separate dir, NOT a sibling .bak),
    // namespaced by runId + agent so two adapters for the same skill never
    // overwrite each other's backup.
    if (existsSync(destPath)) {
      const skillName = basename(dirname(destPath)); // e.g. "example-skill"
      const agent = basename(dirname(dirname(dirname(destPath)))); // ".claude" | "opencode"
      const backupPath = join(backupRootDir, runId, agent, skillName, 'SKILL.md');
      ensureDir(dirname(backupPath));
      copyFileSync(destPath, backupPath);
      backedUp.push({ original: destPath, backup: backupPath });
    }

    // Step 3: atomic write via temp file + rename.
    tmpPath = join(destDir, `.skillkit-tmp-${process.pid}-${runId}`);
    writeFileSync(tmpPath, renderedContent, 'utf8');
    renameSync(tmpPath, destPath);
    tmpPath = undefined; // consumed by rename

    console.log(`  INSTALLED ${destPath}`);
  } catch (err) {
    const unrestored = restore();
    if (unrestored.length > 0) {
      throw new Error(
        `installSkill failed AND rollback was incomplete. Unrestored files:\n` +
        unrestored.map((f) => `  ${f}`).join('\n') +
        `\nOriginal error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    throw err;
  }
}
