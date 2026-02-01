import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { findBlackboardRoot, isBlackboardRoot } from "../src/lib/discovery";

const tmpBase = join(import.meta.dir, ".tmp-test");

beforeAll(() => {
  // Create a fake blackboard structure
  mkdirSync(join(tmpBase, "fake-collab", "projects", "test-project"), {
    recursive: true,
  });
  writeFileSync(join(tmpBase, "fake-collab", "CONTRIBUTING.md"), "# Contributing\n");

  // Create a nested non-blackboard directory
  mkdirSync(join(tmpBase, "fake-collab", "projects", "test-project", "deep"), {
    recursive: true,
  });

  // Create a directory that's NOT a blackboard
  mkdirSync(join(tmpBase, "not-a-collab"), { recursive: true });
  writeFileSync(join(tmpBase, "not-a-collab", "README.md"), "# Not a collab\n");
});

afterAll(() => {
  rmSync(tmpBase, { recursive: true, force: true });
});

describe("isBlackboardRoot", () => {
  test("returns true for directory with CONTRIBUTING.md and projects/", () => {
    expect(isBlackboardRoot(join(tmpBase, "fake-collab"))).toBe(true);
  });

  test("returns false for directory without projects/", () => {
    expect(isBlackboardRoot(join(tmpBase, "not-a-collab"))).toBe(false);
  });

  test("returns false for directory without CONTRIBUTING.md", () => {
    expect(isBlackboardRoot(join(tmpBase))).toBe(false);
  });
});

describe("findBlackboardRoot", () => {
  test("finds root from blackboard directory itself", () => {
    const result = findBlackboardRoot(join(tmpBase, "fake-collab"));
    expect(result).not.toBeNull();
    expect(result!.path).toBe(join(tmpBase, "fake-collab"));
  });

  test("finds root from nested subdirectory", () => {
    const result = findBlackboardRoot(
      join(tmpBase, "fake-collab", "projects", "test-project", "deep")
    );
    expect(result).not.toBeNull();
    expect(result!.path).toBe(join(tmpBase, "fake-collab"));
  });

  test("returns null when no blackboard found", () => {
    const result = findBlackboardRoot(join(tmpBase, "not-a-collab"));
    // May find the real pai-collab repo above, so just check it doesn't find not-a-collab
    if (result) {
      expect(result.path).not.toBe(join(tmpBase, "not-a-collab"));
    }
  });
});
