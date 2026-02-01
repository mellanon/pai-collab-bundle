/**
 * F-1: Repo auto-discovery
 *
 * Walk up from CWD to find a pai-collab blackboard root.
 * Detection heuristic: directory contains both CONTRIBUTING.md and projects/
 */

import { existsSync } from "fs";
import { join, dirname, resolve } from "path";

export interface BlackboardRoot {
  path: string;
}

/**
 * Detect whether a directory is a pai-collab blackboard root.
 * A blackboard root contains CONTRIBUTING.md and a projects/ directory.
 */
export function isBlackboardRoot(dir: string): boolean {
  return (
    existsSync(join(dir, "CONTRIBUTING.md")) &&
    existsSync(join(dir, "projects"))
  );
}

/**
 * Walk up from `startDir` to find the nearest pai-collab blackboard root.
 * Returns the path if found, null otherwise.
 */
export function findBlackboardRoot(
  startDir: string = process.cwd()
): BlackboardRoot | null {
  let current = resolve(startDir);

  while (true) {
    if (isBlackboardRoot(current)) {
      return { path: current };
    }

    const parent = dirname(current);
    if (parent === current) {
      // Reached filesystem root
      return null;
    }
    current = parent;
  }
}

/**
 * Find the blackboard root or exit with a clear error.
 */
export function requireBlackboardRoot(
  startDir?: string
): BlackboardRoot {
  const root = findBlackboardRoot(startDir);
  if (!root) {
    console.error(
      "Error: Not inside a pai-collab blackboard.\n\n" +
        "Could not find a directory containing CONTRIBUTING.md and projects/.\n" +
        "Make sure you're inside a pai-collab repo, or set PAI_COLLAB_ROOT.\n"
    );
    process.exit(1);
  }
  return root;
}
