# F-4: Schema Parsing Library — Spec

## Summary

Parse pai-collab blackboard artifacts into typed TypeScript objects. This is the shared foundation that F-5 (validate), F-6 (project list), F-7 (project status), F-8 (register), F-11 (collab status), and F-12 (status update) all import.

Four artifact types:
1. **PROJECT.yaml** — project identity and metadata (YAML)
2. **CONTRIBUTORS.yaml** — repo-level trust zones (YAML)
3. **JOURNAL.md** — narrative log entries (structured Markdown)
4. **REGISTRY.md** — project and agent index tables (Markdown tables)

Schema definitions are in pai-collab's `CONTRIBUTING.md`. This library parses files that conform to those schemas.

## Dependencies

- **F-1** (repo auto-discovery) — provides the blackboard root path
- `yaml` package (already in package.json) — YAML parsing

No other dependencies. No GitHub auth needed — all local file reads.

---

## TypeScript Interfaces

### PROJECT.yaml

```typescript
/** Canonical lifecycle status values */
type ProjectStatus =
  | "proposed"
  | "building"
  | "hardening"
  | "contrib-prep"
  | "review"
  | "shipped"
  | "evolving"
  | "archived";

type ProjectType = "skill" | "bundle" | "tool" | "infrastructure";

interface ProjectContributor {
  zone: "maintainer" | "trusted" | "untrusted";
  since: string; // YYYY-MM-DD
}

interface ProjectSource {
  repo: string;   // org/repo format
  branch: string;
}

interface Project {
  // Required
  name: string;
  maintainer: string;
  status: ProjectStatus;
  created: string; // YYYY-MM-DD
  license: string; // SPDX identifier
  contributors: Record<string, ProjectContributor>;

  // Optional
  type?: ProjectType;
  upstream?: string;       // org/repo
  fork?: string;           // org/repo
  source?: ProjectSource;
  contrib_branch?: string;
  source_branch?: string;
  tag?: string;
  paths?: string[];
  tests?: string;
  docs?: string;
}
```

### CONTRIBUTORS.yaml

```typescript
type TrustZone = "maintainer" | "trusted" | "untrusted";

interface Contributor {
  zone: TrustZone;
  since: string;           // YYYY-MM-DD
  promoted_by?: string;    // GitHub handle
  timezone?: string;       // e.g., "CET", "NZDT", "PST"
  tags?: string[];         // expertise tags
  availability?: "open" | "limited" | "unavailable";
}

interface Contributors {
  contributors: Record<string, Contributor>;
}
```

### JOURNAL.md

```typescript
type JournalPhase =
  | "Specify"
  | "Build"
  | "Harden"
  | "Contrib Prep"
  | "Review"
  | "Release"
  | "Evolve";

interface JournalEntry {
  date: string;         // YYYY-MM-DD
  title: string;        // Text after the date dash
  author: string;       // @handle (agent: name) — raw string
  phase: JournalPhase;
  status: string;       // One-line status description
  issues: string[];     // ["#54", "#76"] — extracted from Issues line
  whatHappened: string;  // Markdown content of "What Happened" section
  whatEmerged: string;   // Markdown content of "What Emerged" section
}

interface Journal {
  maintainer: string;   // Extracted from header
  entries: JournalEntry[]; // Reverse chronological (newest first)
}
```

### REGISTRY.md

```typescript
interface RegistryProject {
  name: string;
  maintainer: string;
  status: ProjectStatus;
  source: string;        // Link text (typically "PROJECT.yaml")
  contributors: string;  // Raw contributor text
}

interface RegistryAgent {
  agent: string;
  operator: string;
  platform: string;
  skills: string;
  availability: string;
  currentWork: string;
}

interface Registry {
  projects: RegistryProject[];
  agents: RegistryAgent[];
}
```

---

## Public API

### File path: `packages/collab/src/lib/parsers.ts`

```typescript
/**
 * Read and parse a PROJECT.yaml file.
 * @param projectDir - Path to a project directory (e.g., /path/to/pai-collab/projects/signal)
 * @returns Parsed Project object
 * @throws If file not found or YAML is malformed
 */
export function readProject(projectDir: string): Project;

/**
 * Read and parse CONTRIBUTORS.yaml from the blackboard root.
 * @param blackboardRoot - Path to pai-collab root
 * @returns Parsed Contributors object
 * @throws If file not found or YAML is malformed
 */
export function readContributors(blackboardRoot: string): Contributors;

/**
 * Read and parse a JOURNAL.md file into structured entries.
 * @param projectDir - Path to a project directory
 * @returns Parsed Journal with entries array (newest first)
 * @throws If file not found
 */
export function readJournal(projectDir: string): Journal;

/**
 * Read and parse REGISTRY.md tables from the blackboard root.
 * @param blackboardRoot - Path to pai-collab root
 * @returns Parsed Registry with projects and agents arrays
 * @throws If file not found
 */
export function readRegistry(blackboardRoot: string): Registry;

/**
 * Read all PROJECT.yaml files from projects/ directory.
 * Convenience function for F-6 (project list).
 * @param blackboardRoot - Path to pai-collab root
 * @returns Array of { dirName, project } for each project
 */
export function readAllProjects(
  blackboardRoot: string
): Array<{ dirName: string; project: Project }>;
```

### File path: `packages/collab/src/lib/types.ts`

All TypeScript interfaces and type aliases exported separately so other modules can import types without importing parser code.

---

## Parsing Approach

### YAML files (PROJECT.yaml, CONTRIBUTORS.yaml)

Straightforward: read file, parse with `yaml` package, cast to typed interface. No transformation needed — the YAML structure maps 1:1 to the TypeScript types.

```typescript
import { parse } from "yaml";
const raw = readFileSync(path, "utf-8");
const data = parse(raw) as Project;
```

### JOURNAL.md (structured Markdown)

The journal has a predictable structure defined in CONTRIBUTING.md. Parsing approach:

1. **Split on entry boundaries:** Split file content on `\n## ` to get individual entry blocks
2. **Extract heading:** First line of each block: `YYYY-MM-DD — Title` — regex: `/^(\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.+)$/`
3. **Extract metadata fields:** Line-by-line regex for `**Author:**`, `**Phase:**`, `**Status:**`, `**Issues:**`
4. **Extract sections:** Find `### What Happened` and `### What Emerged` headings, capture content between them
5. **Parse issues:** Extract `#\d+` patterns from the Issues line

No full markdown AST needed. The format is constrained enough for line-by-line parsing.

**Edge cases:**
- Journal might not exist yet (new project) → return `{ maintainer: "", entries: [] }`
- Entry might be missing "What Emerged" section → `whatEmerged: ""`
- Date might use `-` instead of `—` → regex handles both
- Maintainer line might be missing → extract from first `**Maintainer:**` line in header

### REGISTRY.md (Markdown tables)

Parse markdown tables by:

1. Find table sections by heading (`## Active Projects`, `## Agent Registry`)
2. Skip header row and separator row (`|---|---|...`)
3. Split each data row on `|`, trim cells
4. Map cells to interface fields by column position

**Edge cases:**
- Cells may contain markdown links `[text](url)` → extract text
- Table might be empty (no data rows) → return empty array
- Extra whitespace in cells → trim

---

## Error Handling

- **File not found:** Throw descriptive error: `"PROJECT.yaml not found in {path}"`
- **YAML parse error:** Let the `yaml` package throw, wrap with context: `"Failed to parse PROJECT.yaml in {path}: {yamlError}"`
- **Missing required fields:** Don't validate here — that's F-5's job. The parser reads what's there.
- **Malformed journal entries:** Skip entries that don't match the expected pattern, log a warning

**Design principle:** The parser is permissive. It reads what exists and structures it. Validation (checking required fields, valid status values, etc.) is F-5's responsibility. This separation means `collab project list` can show a project with missing fields rather than crashing.

---

## Test Plan

### Unit tests: `packages/collab/tests/parsers.test.ts`

**PROJECT.yaml tests:**
- Parse a complete upstream contribution project (signal pattern)
- Parse a minimal standalone tool project (pai-secret-scanning pattern)
- Parse project with all optional fields
- Handle missing optional fields gracefully

**CONTRIBUTORS.yaml tests:**
- Parse file with multiple contributors at different trust zones
- Handle optional fields (timezone, tags, availability)

**JOURNAL.md tests:**
- Parse journal with multiple entries
- Extract all metadata fields correctly
- Handle missing "What Emerged" section
- Handle empty journal (header only, no entries)
- Parse issue references from Issues line

**REGISTRY.md tests:**
- Parse Active Projects table
- Parse Agent Registry table
- Handle markdown links in cells
- Handle empty tables

**readAllProjects tests:**
- Read multiple project directories
- Skip directories without PROJECT.yaml

### Integration test against real pai-collab

- Point parsers at `/Users/andreas/Developer/pai-collab`
- Verify all 5 projects parse successfully
- Verify CONTRIBUTORS.yaml parses with 3 contributors
- Verify JOURNAL.md entries parse for collab-bundle project
- Verify REGISTRY.md parses with correct project count

---

## File Structure

```
packages/collab/src/lib/
├── types.ts      ← All TypeScript interfaces (no runtime code)
├── parsers.ts    ← All parser functions
└── discovery.ts  ← (existing) F-1 repo auto-discovery

packages/collab/tests/
├── parsers.test.ts  ← Unit + integration tests
├── discovery.test.ts ← (existing)
└── cli.test.ts       ← (existing)
```

## Out of Scope

- **Validation logic** — F-5's job. Parser reads, validator checks.
- **Writing/updating files** — F-8 (register) and F-12 (status update) handle writes.
- **GitHub API calls** — F-3/F-9 territory.
- **Spoke schema parsing** — F-18's job (`.collab/manifest.yaml`).

## Status: SPEC COMPLETE
