import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { validateBlackboard } from "../src/lib/validator";

const tmpBase = join(import.meta.dir, ".tmp-validator");

beforeAll(() => {
  // Valid blackboard
  mkdirSync(join(tmpBase, "valid", "projects", "good-project"), { recursive: true });
  writeFileSync(
    join(tmpBase, "valid", "CONTRIBUTING.md"),
    "# Contributing\n"
  );
  writeFileSync(
    join(tmpBase, "valid", "projects", "good-project", "PROJECT.yaml"),
    `name: Good Project
maintainer: alice
status: building
created: 2026-01-15
license: MIT
contributors:
  alice:
    zone: maintainer
    since: 2026-01-15
`
  );
  writeFileSync(
    join(tmpBase, "valid", "CONTRIBUTORS.yaml"),
    `contributors:
  alice:
    zone: maintainer
    since: 2026-01-15
`
  );
  writeFileSync(
    join(tmpBase, "valid", "projects", "good-project", "JOURNAL.md"),
    `# Good Project — Journey Log

**Maintainer:** @alice

---

## 2026-01-15 — Started

**Author:** @alice (agent: Bot)
**Phase:** Specify
**Status:** Project started
**Issues:** #1

### What Happened
- Created project

---
`
  );
  writeFileSync(
    join(tmpBase, "valid", "REGISTRY.md"),
    `# Registry

## Active Projects

| Project | Maintainer | Status | Source | Contributors |
|---------|-----------|--------|--------|-------------|
| good-project | @alice | building | PROJECT.yaml | @alice |

## Agent Registry (Daemon Entries)

| Agent | Operator | Platform | Skills | Availability | Current Work |
|-------|----------|----------|--------|-------------|-------------|
| Bot | @alice | PAI | TS | open | good-project |
`
  );

  // Invalid blackboard
  mkdirSync(join(tmpBase, "invalid", "projects", "bad-project"), { recursive: true });
  writeFileSync(join(tmpBase, "invalid", "CONTRIBUTING.md"), "# Contributing\n");
  writeFileSync(
    join(tmpBase, "invalid", "projects", "bad-project", "PROJECT.yaml"),
    `name: Bad Project
maintainer: bob
status: wip
created: 2026-01-15
license: GPL-3.0
contributors:
  bob:
    zone: admin
    since: 2026-01-15
`
  );
  writeFileSync(
    join(tmpBase, "invalid", "CONTRIBUTORS.yaml"),
    `contributors:
  bob:
    zone: admin
    since: 2026-01-15
`
  );
  writeFileSync(
    join(tmpBase, "invalid", "projects", "bad-project", "JOURNAL.md"),
    `# Bad Project — Journey Log

**Maintainer:** @bob

---

## 2026-01-15 — Started

**Author:** @bob
**Phase:** Planning
**Status:** Started
**Issues:** #1

### What Happened
- Started

---
`
  );
  writeFileSync(
    join(tmpBase, "invalid", "REGISTRY.md"),
    `# Registry

## Active Projects

| Project | Maintainer | Status | Source | Contributors |
|---------|-----------|--------|--------|-------------|
| bad-project | @bob | shipped | PROJECT.yaml | @bob |

## Agent Registry (Daemon Entries)

| Agent | Operator | Platform | Skills | Availability | Current Work |
|-------|----------|----------|--------|-------------|-------------|
`
  );
});

afterAll(() => {
  rmSync(tmpBase, { recursive: true, force: true });
});

describe("validateBlackboard", () => {
  test("returns no violations for valid blackboard", () => {
    const v = validateBlackboard(join(tmpBase, "valid"));
    expect(v).toHaveLength(0);
  });

  test("catches invalid project status", () => {
    const v = validateBlackboard(join(tmpBase, "invalid"));
    const statusV = v.find((x) => x.field === "status" && x.file.includes("PROJECT.yaml"));
    expect(statusV).toBeDefined();
    expect(statusV!.message).toContain("wip");
  });

  test("catches invalid license", () => {
    const v = validateBlackboard(join(tmpBase, "invalid"));
    const licV = v.find((x) => x.field === "license");
    expect(licV).toBeDefined();
    expect(licV!.message).toContain("GPL-3.0");
  });

  test("catches invalid contributor zone in PROJECT.yaml", () => {
    const v = validateBlackboard(join(tmpBase, "invalid"));
    const zoneV = v.find((x) => x.field.includes("bob.zone") && x.file.includes("PROJECT"));
    expect(zoneV).toBeDefined();
    expect(zoneV!.message).toContain("admin");
  });

  test("catches invalid contributor zone in CONTRIBUTORS.yaml", () => {
    const v = validateBlackboard(join(tmpBase, "invalid"));
    const zoneV = v.find((x) => x.field === "bob.zone" && x.file === "CONTRIBUTORS.yaml");
    expect(zoneV).toBeDefined();
  });

  test("catches invalid journal phase", () => {
    const v = validateBlackboard(join(tmpBase, "invalid"));
    const phaseV = v.find((x) => x.field === "phase" && x.file.includes("JOURNAL"));
    expect(phaseV).toBeDefined();
    expect(phaseV!.message).toContain("Planning");
  });

  test("catches REGISTRY status mismatch", () => {
    const v = validateBlackboard(join(tmpBase, "invalid"));
    const regV = v.find((x) => x.file === "REGISTRY.md" && x.field === "status");
    expect(regV).toBeDefined();
    expect(regV!.message).toContain("shipped");
    expect(regV!.message).toContain("wip");
  });
});
