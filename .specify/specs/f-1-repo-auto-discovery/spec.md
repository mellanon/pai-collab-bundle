# F-1: Repo Auto-Discovery — Spec

## Summary
Walk up from CWD to find a pai-collab blackboard root by detecting `CONTRIBUTING.md` + `projects/` directory. Provides base path for all other commands.

## Detection Heuristic
A directory is a blackboard root if it contains both:
- `CONTRIBUTING.md`
- `projects/` directory

## API
- `isBlackboardRoot(dir: string): boolean`
- `findBlackboardRoot(startDir?: string): BlackboardRoot | null`
- `requireBlackboardRoot(startDir?: string): BlackboardRoot` — exits with error if not found

## Error Behavior
Clear message when no blackboard found:
```
Error: Not inside a pai-collab blackboard.
Could not find a directory containing CONTRIBUTING.md and projects/.
Make sure you're inside a pai-collab repo, or set PAI_COLLAB_ROOT.
```

## Implementation
- `packages/collab/src/lib/discovery.ts`
- Tests: `packages/collab/tests/discovery.test.ts` (7 tests)

## Status: IMPLEMENTED
