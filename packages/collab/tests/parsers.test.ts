import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import {
  readProject,
  readAllProjects,
  readContributors,
  readJournal,
  readRegistry,
} from "../src/lib/parsers";

const tmpBase = join(import.meta.dir, ".tmp-parsers");

beforeAll(() => {
  // Create fake blackboard
  mkdirSync(join(tmpBase, "projects", "test-tool"), { recursive: true });
  mkdirSync(join(tmpBase, "projects", "test-upstream"), { recursive: true });
  mkdirSync(join(tmpBase, "projects", "no-yaml"), { recursive: true });

  // Standalone tool PROJECT.yaml
  writeFileSync(
    join(tmpBase, "projects", "test-tool", "PROJECT.yaml"),
    `name: test-tool
maintainer: alice
status: shipped
created: 2026-01-15
license: MIT
type: tool
source:
  repo: alice/test-tool
  branch: main
tests: bun test

contributors:
  alice:
    zone: maintainer
    since: 2026-01-15
`
  );

  // Upstream contribution PROJECT.yaml
  writeFileSync(
    join(tmpBase, "projects", "test-upstream", "PROJECT.yaml"),
    `name: Test Upstream
maintainer: bob
status: building
created: 2026-01-20
license: MIT
type: skill
upstream: org/repo
fork: bob/repo
contrib_branch: contrib/v1
source_branch: feature/main
paths:
  - src/
  - hooks/
tests: bun test

contributors:
  bob:
    zone: maintainer
    since: 2026-01-20
  alice:
    zone: trusted
    since: 2026-01-25
`
  );

  // CONTRIBUTORS.yaml
  writeFileSync(
    join(tmpBase, "CONTRIBUTORS.yaml"),
    `contributors:
  alice:
    zone: maintainer
    since: 2026-01-15
    timezone: PST
    tags: [infra, tooling]
    availability: open
  bob:
    zone: trusted
    since: 2026-01-20
    promoted_by: alice
    timezone: CET
    tags: [security]
    availability: limited
  charlie:
    zone: untrusted
    since: 2026-01-25
`
  );

  // JOURNAL.md
  writeFileSync(
    join(tmpBase, "projects", "test-tool", "JOURNAL.md"),
    `# test-tool — Journey Log

**Maintainer:** @alice

---

## 2026-01-20 — Feature Complete

**Author:** @alice (agent: TestBot)
**Phase:** Build
**Status:** All features implemented
**Issues:** #10, #12

### What Happened
- Implemented core parsing
- Added test coverage

### What Emerged
- The YAML library handles edge cases well

---

## 2026-01-15 — Project Started

**Author:** @alice (agent: TestBot)
**Phase:** Specify
**Status:** Project registered
**Issues:** #5

### What Happened
- Created repo and registered on blackboard

---
`
  );

  // REGISTRY.md
  writeFileSync(
    join(tmpBase, "REGISTRY.md"),
    `# Community Registry

## Active Projects

| Project | Maintainer | Status | Source | Contributors |
|---------|-----------|--------|--------|-------------|
| test-tool | @alice | shipped | [PROJECT.yaml](projects/test-tool/PROJECT.yaml) | @alice |
| test-upstream | @bob | building | [PROJECT.yaml](projects/test-upstream/PROJECT.yaml) | @bob, @alice |

## Agent Registry (Daemon Entries)

| Agent | Operator | Platform | Skills | Availability | Current Work |
|-------|----------|----------|--------|-------------|-------------|
| TestBot | @alice | PAI + Claude | TypeScript, testing | open | test-tool |
| BuildBot | @bob | PAI + Maestro | Security | busy | test-upstream |
`
  );
});

afterAll(() => {
  rmSync(tmpBase, { recursive: true, force: true });
});

// === PROJECT.yaml tests ===

describe("readProject", () => {
  test("parses standalone tool project", () => {
    const p = readProject(join(tmpBase, "projects", "test-tool"));
    expect(p.name).toBe("test-tool");
    expect(p.maintainer).toBe("alice");
    expect(p.status).toBe("shipped");
    expect(p.created).toBe("2026-01-15");
    expect(p.license).toBe("MIT");
    expect(p.type).toBe("tool");
    expect(p.source?.repo).toBe("alice/test-tool");
    expect(p.source?.branch).toBe("main");
    expect(p.tests).toBe("bun test");
    expect(p.contributors.alice.zone).toBe("maintainer");
  });

  test("parses upstream contribution with all optional fields", () => {
    const p = readProject(join(tmpBase, "projects", "test-upstream"));
    expect(p.name).toBe("Test Upstream");
    expect(p.upstream).toBe("org/repo");
    expect(p.fork).toBe("bob/repo");
    expect(p.contrib_branch).toBe("contrib/v1");
    expect(p.source_branch).toBe("feature/main");
    expect(p.paths).toEqual(["src/", "hooks/"]);
    expect(Object.keys(p.contributors)).toHaveLength(2);
  });

  test("throws for missing PROJECT.yaml", () => {
    expect(() => readProject(join(tmpBase, "projects", "no-yaml"))).toThrow(
      "PROJECT.yaml not found"
    );
  });
});

// === readAllProjects tests ===

describe("readAllProjects", () => {
  test("reads all projects with valid PROJECT.yaml", () => {
    const all = readAllProjects(tmpBase);
    expect(all).toHaveLength(2);
    const names = all.map((p) => p.dirName).sort();
    expect(names).toEqual(["test-tool", "test-upstream"]);
  });

  test("skips directories without PROJECT.yaml", () => {
    const all = readAllProjects(tmpBase);
    const dirs = all.map((p) => p.dirName);
    expect(dirs).not.toContain("no-yaml");
  });
});

// === CONTRIBUTORS.yaml tests ===

describe("readContributors", () => {
  test("parses all contributors", () => {
    const c = readContributors(tmpBase);
    expect(Object.keys(c.contributors)).toHaveLength(3);
  });

  test("parses trust zones correctly", () => {
    const c = readContributors(tmpBase);
    expect(c.contributors.alice.zone).toBe("maintainer");
    expect(c.contributors.bob.zone).toBe("trusted");
    expect(c.contributors.charlie.zone).toBe("untrusted");
  });

  test("parses optional fields", () => {
    const c = readContributors(tmpBase);
    expect(c.contributors.alice.timezone).toBe("PST");
    expect(c.contributors.alice.tags).toEqual(["infra", "tooling"]);
    expect(c.contributors.bob.promoted_by).toBe("alice");
    expect(c.contributors.bob.availability).toBe("limited");
  });

  test("handles missing optional fields", () => {
    const c = readContributors(tmpBase);
    expect(c.contributors.charlie.timezone).toBeUndefined();
    expect(c.contributors.charlie.tags).toBeUndefined();
  });
});

// === JOURNAL.md tests ===

describe("readJournal", () => {
  test("extracts maintainer", () => {
    const j = readJournal(join(tmpBase, "projects", "test-tool"));
    expect(j.maintainer).toBe("@alice");
  });

  test("parses all entries in order", () => {
    const j = readJournal(join(tmpBase, "projects", "test-tool"));
    expect(j.entries).toHaveLength(2);
    expect(j.entries[0].date).toBe("2026-01-20");
    expect(j.entries[1].date).toBe("2026-01-15");
  });

  test("extracts metadata fields", () => {
    const j = readJournal(join(tmpBase, "projects", "test-tool"));
    const entry = j.entries[0];
    expect(entry.author).toBe("@alice (agent: TestBot)");
    expect(entry.phase).toBe("Build");
    expect(entry.status).toBe("All features implemented");
    expect(entry.issues).toEqual(["#10", "#12"]);
  });

  test("extracts What Happened and What Emerged", () => {
    const j = readJournal(join(tmpBase, "projects", "test-tool"));
    expect(j.entries[0].whatHappened).toContain("Implemented core parsing");
    expect(j.entries[0].whatEmerged).toContain("YAML library handles edge cases");
  });

  test("handles entry without What Emerged", () => {
    const j = readJournal(join(tmpBase, "projects", "test-tool"));
    expect(j.entries[1].whatEmerged).toBe("");
  });

  test("returns empty journal for missing file", () => {
    const j = readJournal(join(tmpBase, "projects", "no-yaml"));
    expect(j.entries).toHaveLength(0);
    expect(j.maintainer).toBe("");
  });
});

// === REGISTRY.md tests ===

describe("readRegistry", () => {
  test("parses Active Projects table", () => {
    const r = readRegistry(tmpBase);
    expect(r.projects).toHaveLength(2);
    expect(r.projects[0].name).toBe("test-tool");
    expect(r.projects[0].maintainer).toBe("@alice");
    expect(r.projects[0].status).toBe("shipped");
  });

  test("strips markdown links from cells", () => {
    const r = readRegistry(tmpBase);
    expect(r.projects[0].source).toBe("PROJECT.yaml");
  });

  test("parses Agent Registry table", () => {
    const r = readRegistry(tmpBase);
    expect(r.agents).toHaveLength(2);
    expect(r.agents[0].agent).toBe("TestBot");
    expect(r.agents[0].operator).toBe("@alice");
    expect(r.agents[1].availability).toBe("busy");
  });
});

// === Integration test against real pai-collab ===

const paiCollabPath = "/Users/andreas/Developer/pai-collab";

describe("integration: real pai-collab", () => {
  test("reads all registered projects", () => {
    const all = readAllProjects(paiCollabPath);
    expect(all.length).toBeGreaterThanOrEqual(5);
    const names = all.map((p) => p.project.name);
    expect(names).toContain("pai-collab-bundle");
  });

  test("reads CONTRIBUTORS.yaml", () => {
    const c = readContributors(paiCollabPath);
    expect(Object.keys(c.contributors).length).toBeGreaterThanOrEqual(2);
    expect(c.contributors.mellanon.zone).toBe("maintainer");
  });

  test("reads collab-bundle JOURNAL.md", () => {
    const j = readJournal(join(paiCollabPath, "projects", "collab-bundle"));
    expect(j.entries.length).toBeGreaterThanOrEqual(1);
    expect(j.maintainer).toBe("@mellanon");
  });

  test("reads REGISTRY.md", () => {
    const r = readRegistry(paiCollabPath);
    expect(r.projects.length).toBeGreaterThanOrEqual(5);
    expect(r.agents.length).toBeGreaterThanOrEqual(2);
  });
});
