import { homedir } from 'node:os';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { join, dirname, basename } from 'node:path';

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
// installSkill()
// ---------------------------------------------------------------------------
// Installs rendered skill content to destPath (absolute, produced by an Adapter).
//
// Parameters:
//   renderedContent  — full SKILL.md text (frontmatter + body)
//   destPath         — absolute destination (from Adapter.resolveInstallPath)
//   dryRun           — when true, only logs intent; zero FS mutation
//   backupRootDir    — root dir for backups (default: ~/.skillkit/backups)
//
// Dry-run: logs WOULD-CREATE or WOULD-OVERWRITE destPath; returns immediately.
//
// Real run (atomic):
//   1. Safety guard — throws if destPath is outside INSTALL_ROOTS.
//   2. mkdir -p the destination directory.
//   3. If destPath already exists: copy it to
//      backupRootDir/{timestamp}/{skillName}/SKILL.md (separate dir — NOT sibling).
//   4. Write to a temp file in the same destination dir.
//   5. fs.renameSync(tmp, dest) — atomic on POSIX.
//
// Error recovery:
//   On any error after backups have been taken:
//   - restore every backed-up file to its original location
//   - remove every directory this call created
//   - re-throw the original error

const DEFAULT_BACKUP_ROOT = join(homedir(), '.skillkit', 'backups');

export function installSkill(
  renderedContent: string,
  destPath: string,
  dryRun: boolean,
  backupRootDir: string = DEFAULT_BACKUP_ROOT,
): void {
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

  // -------------------------------------------------------------------------
  // Real run
  // -------------------------------------------------------------------------

  // Track mutations for rollback.
  const backedUp: Array<{ original: string; backup: string }> = [];
  const createdDirs: string[] = [];

  function ensureDir(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      createdDirs.push(dir);
    }
  }

  function restore(): void {
    // Restore backed-up files first.
    for (const { original, backup } of backedUp) {
      try {
        ensureDirQuiet(dirname(original));
        copyFileSync(backup, original);
      } catch {
        // Best-effort; log but don't throw again.
        console.error(`  [rollback] failed to restore ${original} from ${backup}`);
      }
    }
    // Remove dirs this run created (in reverse order so children come before parents).
    for (const dir of createdDirs.reverse()) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        console.error(`  [rollback] failed to remove dir ${dir}`);
      }
    }
  }

  function ensureDirQuiet(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  try {
    const destDir = dirname(destPath);

    // Step 1: ensure destination directory exists.
    ensureDir(destDir);

    // Step 2: backup existing file (separate dir, NOT a sibling .bak).
    if (existsSync(destPath)) {
      const skillName = basename(dirname(destPath)); // e.g. "example-skill"
      const timestamp = Date.now().toString();
      const backupPath = join(backupRootDir, timestamp, skillName, 'SKILL.md');
      ensureDir(dirname(backupPath));
      copyFileSync(destPath, backupPath);
      backedUp.push({ original: destPath, backup: backupPath });
    }

    // Step 3: atomic write via temp file + rename.
    const tmpPath = join(destDir, `.skillkit-tmp-${process.pid}-${Date.now()}`);
    writeFileSync(tmpPath, renderedContent, 'utf8');
    renameSync(tmpPath, destPath);

    console.log(`  INSTALLED ${destPath}`);
  } catch (err) {
    restore();
    throw err;
  }
}
