# Changelog

## 1.0.1 — 2026-10-06

Patch release containing the local code-review fixes, without dependency upgrades or database migrations.

### Fixed

- Enforce private-board visibility for board listings, nested tasks/comments, workspace analytics, and task activity feeds. Private boards remain accessible to their creator and workspace owners/managers who are current workspace members.
- Revoke comment editing/deletion access when an author is removed from a workspace.
- Rate-limit login requests and return JSON authentication errors to the frontend.
- Respect workspace roles in management controls and display errors for member operations.
- Update task ordering optimistically, restore cached lists after failed moves, and refresh affected server data.
- Add keyboard dragging and move-handle focus support for boards, columns, and tasks.
- Normalize board/column positions after deletion.
- Serialize board/column/task position allocation and revalidate locked tasks before movement, update, or deletion.
- Make board test visibility deterministic and add seven backend regression tests.

### Validation

- Backend: 160 tests and 459 assertions passed locally.
- Frontend: lint, TypeScript checks, and production build passed locally.
- CI runs on the pushed main-branch commit; its result is recorded in GitHub Actions.

### Known issues and verification gaps

- Example development URLs mix localhost and 127.0.0.1, and the default Sanctum stateful-domain list omits localhost:5173. Align hostnames and configure the frontend hostname/port when setting up a fresh installation.
- Managers can bypass the owner-only role-change restriction by removing and re-adding members with a different role.
- Project changes do not invalidate cached workspace analytics.
- Browser verification of keyboard dragging and rollback, and MySQL concurrency testing, remain outstanding. The backend suite uses in-memory SQLite.

### Upgrade

No migrations or dependency upgrades are required. Restart the application or rebuild the frontend after updating. Private-board access is now restricted; a regular member who previously accessed another user's private board will lose that access.
