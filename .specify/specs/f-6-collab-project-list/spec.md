# F-6: collab project list — Spec

## Summary
List all projects in projects/ directory with name, status, maintainer, and type from PROJECT.yaml. JSON output by default, --pretty for formatted table.

## CLI Usage
```bash
collab project list              # JSON array
collab project list --pretty     # Formatted table
```

## Output Schema (JSON)
```json
[
  { "name": "PAI Signal", "dirName": "signal", "maintainer": "mellanon", "status": "contrib-prep", "type": "skill" },
  { "name": "pai-collab-bundle", "dirName": "collab-bundle", "maintainer": "mellanon", "status": "building", "type": "tool" }
]
```

## Dependencies
- F-1 (repo discovery) — find blackboard root
- F-4 (parsers) — readAllProjects()

## Implementation
- Wire up `commands/project.ts` list action to use discovery + parsers
- Exit 0 on success, exit 1 if not in a blackboard

## Status: SPEC COMPLETE
