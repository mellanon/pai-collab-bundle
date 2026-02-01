# App Context: pai-collab-bundle

## Problem Statement
The pai-collab blackboard relies on agents manually following CLAUDE.md, SOPs, and CONTRIBUTING.md to interact with the governance model. This works for 2-3 operators but doesn't scale. There's no deterministic, repeatable way to query issues, register projects, update status, or validate schemas — agents generate ad-hoc commands every time. The CLI codifies these operations into predictable, structured commands.

## Users & Stakeholders
- **Primary users:** PAI agents running programmatically (agent-first design)
- **Secondary users:** Human operators and contributors running from terminal
- **Stakeholders:** pai-collab maintainers, contributors (trusted and untrusted), external contributors via fork-and-PR
- **Technical level:** Mixed — some PAI-literate, some newcomers. CLI must be self-documenting with clear help text and error messages.

## Current State
- pai-collab repo exists with full governance: CLAUDE.md, 12 SOPs, CONTRIBUTING.md schemas, TRUST-MODEL.md, CI validation gates
- 5 active projects registered on the blackboard
- Agents interact manually via gh CLI, file editing, git operations
- specflow-bundle exists as the architectural pattern to follow (Bun + TS, packages/ layout)
- GitHub Issues + Labels are the work queue

## Constraints & Requirements
- **Runtime:** Bun + TypeScript
- **Output:** JSON by default, `--pretty` flag for human-readable
- **Write behavior:** Mixed — writes files directly for local ops, uses gh CLI for GitHub ops
- **CLI structure:** Grouped noun-verb: `collab <resource> <action> [args]`
- **Repo discovery:** Auto-discover pai-collab root by walking up from CWD (like git)
- **CLI binary in PATH:** Installed globally so it can be run from anywhere
- **GitHub auth:** Degrade gracefully — local features work without auth, GitHub features prompt for `gh auth login`
- **Error handling:** Report violations + suggest fix (don't auto-apply)
- **pai-collab specific:** Hardcoded to pai-collab schema and governance model for v1.0

## User Experience
- Agent invokes: `collab issue list --scope signal --type task` → gets JSON array
- Human invokes: `collab project status signal --pretty` → gets formatted table
- Error output: `collab validate` → reports schema violations with suggested fixes and exit code
- Discovery: `collab --help` shows grouped command tree with descriptions

## Edge Cases & Error Handling
- **No pai-collab repo found:** Clear error with setup instructions
- **gh not authenticated:** Local-only features still work, GitHub features show auth required message
- **Malformed artifacts:** Report + suggest fix, don't auto-correct
- **Missing required fields in PROJECT.yaml:** Specific error per missing field
- **Concurrent edits:** Not a concern for v1.0 (single-agent ops)

## Success Criteria
- All 6 command groups functional: issue, project, status, journal, onboard, validate
- JSON output parseable by agents
- Pretty output readable by humans
- Schema validation matches CI gates (validate-schemas.mjs)
- Help text self-documenting for newcomers
- Tests pass via `bun test`

## Scope

### In Scope (v1.0)
- Issue discovery (query by scope, type, labels, cross-cutting)
- Project registration (scaffold projects/ directory with canonical schemas)
- Status updates (update PROJECT.yaml, REGISTRY.md, STATUS.md in sync)
- Journal entries (append entries following JOURNAL.md schema)
- Agent onboarding (automate onboarding SOP: ARRIVE through REPORT)
- Schema validation (validate artifacts against CONTRIBUTING.md schemas)
- CLI binary installed in PATH
- JSON + pretty output modes

### Explicitly Out of Scope
- PAI skill wrapper (_COLLAB) — ship CLI first, add skill later
- Satellite repo introspection — future feature
- Automated PR creation/review — manual for v1.0
- Support for other blackboards — pai-collab specific
- Interactive/TUI mode — CLI only
