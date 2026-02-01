# F-5: collab validate — Spec

## Summary
Validate PROJECT.yaml, CONTRIBUTORS.yaml, JOURNAL.md against CONTRIBUTING.md schemas. Report violations with suggested fixes. Exit non-zero on failure.

## CLI Usage
```bash
collab validate              # Validate all artifacts
collab validate --pretty     # Human-readable violation report
```

## Validation Rules

### PROJECT.yaml
- Required fields present: name, maintainer, status, created, license, contributors
- status is a valid lifecycle value
- license is an accepted SPDX identifier (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause)
- Each contributor has zone and since
- zone is one of: maintainer, trusted, untrusted

### CONTRIBUTORS.yaml
- Has contributors key
- Each contributor has zone and since
- zone is valid

### JOURNAL.md
- Each entry has date, author, phase, status
- Phase is a valid value
- Issues field present

### Cross-file consistency
- REGISTRY.md status matches PROJECT.yaml status for each project
- REGISTRY.md maintainer matches PROJECT.yaml maintainer

## Output
JSON array of violations:
```json
[
  { "file": "projects/signal/PROJECT.yaml", "field": "status", "message": "Invalid status 'wip'. Valid: proposed, building, ...", "suggestion": "Use 'building'" }
]
```

Exit 0 if no violations, exit 1 if violations found.

## Dependencies
- F-2 (CLI framework), F-4 (parsers)
