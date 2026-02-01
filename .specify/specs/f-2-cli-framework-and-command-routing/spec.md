# F-2: CLI Framework and Command Routing — Spec

## Summary
Bun + TypeScript CLI entry point with grouped noun-verb command structure (`collab <resource> <action>`). Global flags: `--help`, `--version`, `--json`/`--pretty`.

## Command Groups
- `collab project [list|status|register]`
- `collab issue [list|create]`
- `collab status`
- `collab journal [append]`
- `collab onboard [arrive|discover|report]`
- `collab validate [--spoke]`
- `collab spoke [sync|validate]`

## Framework
- Commander.js for routing
- JSON output by default, `--pretty` for human-readable
- Each command group in its own file under `src/commands/`

## Implementation
- `packages/collab/src/index.ts` — entry point
- `packages/collab/src/commands/*.ts` — 7 command files
- `packages/collab/src/lib/output.ts` — JSON/pretty formatter
- Tests: `packages/collab/tests/cli.test.ts` (4 tests)

## Status: IMPLEMENTED
