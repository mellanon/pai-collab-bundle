# F-4: Schema Parsing Library — Plan

## Approach

Single module (`parsers.ts`) with types in a separate file (`types.ts`). No abstraction layers — direct file reads with yaml package for YAML, line-by-line regex for Markdown.

## Implementation Order

1. **types.ts** — All interfaces and type aliases (no runtime code)
2. **parsers.ts — YAML parsers** — `readProject()`, `readContributors()`, `readAllProjects()`
3. **parsers.ts — JOURNAL.md parser** — `readJournal()` with section splitting
4. **parsers.ts — REGISTRY.md parser** — `readRegistry()` with table extraction
5. **Tests** — Unit tests with fixtures, integration test against real pai-collab

## Key Decisions

- **yaml package** for YAML parsing (already installed)
- **No markdown AST parser** — JOURNAL.md and REGISTRY.md have constrained formats, line-by-line regex is sufficient and avoids a dependency
- **Permissive parsing** — read what's there, don't validate. F-5 validates.
- **Separate types.ts** — so consumers can `import type` without pulling in fs/yaml runtime

## Risks

- JOURNAL.md format variations (dash vs em-dash, missing sections) — mitigated by flexible regex
- REGISTRY.md table format changes — low risk, format is stable in CONTRIBUTING.md
