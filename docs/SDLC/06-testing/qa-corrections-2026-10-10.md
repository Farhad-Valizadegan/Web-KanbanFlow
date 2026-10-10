# QA corrections — 2026-10-10

## Changes

- Workspace membership mutations (add, remove, and role change) are now owner-only. Managers retain project/board management rights and membership listing access. This closes direct and remove/re-add role-change paths without introducing new membership-history storage.
- Protected routes redirect to login only for HTTP 401. Network and other server errors show an accessible retry screen without exposing protected content; retry is disabled while a request is in progress.
- Composer license metadata is `proprietary`, matching the root README's existing terms. Dependency licenses are unchanged.
- Existing backend formatting violations were corrected with Laravel Pint.
- Focused frontend session regression checks run through `npm test` and are included in CI.

## DEC-003 / PB-001 outcome

The user authorized fixing all findings from the preceding QA review. The conservative owner-only membership option was selected on 2026-10-10 and communicated before implementation. Manager membership delegation is intentionally removed; restoring delegation requires an explicit safe policy and corresponding regression coverage.

Earlier documentation and diagrams discussing the open bypass describe the pre-correction state. This amendment supersedes that current-status wording; historical release notes retain their original observations.

## Regression evidence

Three membership tests first failed against the original implementation: manager add returned 201, manager remove returned 200, and the remove/re-add path allowed removal. After the policy change, the membership suite passes and verifies rejection without changing the existing membership role, along with existing owner operations and protections.

Frontend checks cover confirmed 401, offline requests, 403/419/429/500/503 errors, retry invocation, disabled pending retry, loading, and successful protected content. These component-level checks use controlled session-query outcomes and do not replace real browser acceptance.

No dependency version changes, database schema changes, production deployment, or recovery operation are part of these corrections. MySQL contention, full browser/accessibility journeys, and production recovery remain separate verification work.

## Final local verification

- Backend: 164 tests passed, 473 assertions.
- Laravel Pint check passed; Composer metadata validation passed.
- Frontend: 10 session regression tests passed; lint and TypeScript/Vite production build passed.
- No database migrations or dependency version changes were introduced.
