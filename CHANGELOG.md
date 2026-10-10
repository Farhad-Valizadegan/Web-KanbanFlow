# Changelog

## 1.1.1 — 2026-10-10

### Fixed

- Reserve workspace membership additions/removals and role changes to owners, closing the manager remove/re-add bypass; update the UI to match.
- Keep protected routes recoverable on network/server session-check failures; redirect only on confirmed HTTP 401.
- Align backend license metadata with the existing proprietary repository terms.
- Correct backend formatting and add protected-route session regression checks to CI.

### Upgrade

- No migrations or dependency version changes. Update the backend and rebuild the frontend. Managers must ask the owner to change workspace membership.
- See [QA correction record](docs/SDLC/06-testing/qa-corrections-2026-10-10.md). Historical release issues below describe their original release state.

## 1.1.0 — 2026-10-07

### UI and UX

- Add Light, Dark, and System themes across all screens, remember the preference, and synchronize it between tabs.
- Add persistent navigation, breadcrumbs, a skip link, route titles, and recoverable unexpected-error/not-found screens.
- Redesign the welcome page and standardize cards, spacing, typography, form fields, keyboard focus, and phone layouts.
- Add workspace/project/board search with result counts and empty-result feedback; disable board reordering while filtered.
- Add password visibility controls and connect validation messages to their fields.
- Make the workspace creation dialog keyboard accessible with focus containment, Escape dismissal, focus restoration, and scroll locking.
- Redirect existing sessions away from sign-in and registration forms; show clear connection, expired-session, and rate-limit errors.

### Validation

- Frontend lint, TypeScript checks, and production build passed.
- Backend regression suite: 163 tests, 470 assertions passed.
- Browser checks covered light/dark modes, saved preference, mobile layout, list search, password controls, dialog keyboard navigation, and existing-session redirects.

### Upgrade and known issues

- Rebuild the frontend; no database migrations or dependency upgrades are required.
- Manager remove/re-add role changes remain possible pending a membership-permission decision. Workspace owners should manage membership until resolved.


## 1.0.2 — 2026-10-06

Patch release for local session authentication and dashboard analytics, including the branding changes made since v1.0.1. No dependency upgrades or database migrations.

### Fixed

- Align default frontend/backend hosts on localhost and explicitly configure the frontend URL and Sanctum stateful domains, including port 5173.
- Refresh workspace analytics after project creation, editing, and deletion.
- Add regression coverage for trusted SPA origins, login/logout, and registration sessions.

### Validation

- Backend: 163 tests and 470 assertions passed.
- Frontend lint, TypeScript checks, and production build passed.
- Isolated browser checks passed for login, live project totals, persisted keyboard task reordering, and WIP-limit rejection/rollback.
- Disposable MySQL contention checks passed for WIP limits and column position allocation with four competing requests each.

### Remaining issues

- Manager remove/re-add role changes remain possible pending a membership-permission decision.
- Renaming the local folder to Web-KanbanFlow is still blocked by an open process. The GitHub repository has been renamed.

### Upgrade

Align APP_URL and VITE_API_URL on http://localhost:8000, set FRONTEND_URL=http://localhost:5173 and SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000, clear the backend configuration cache, and restart development servers. Use deployment-specific URLs in production.


### Changed

- Standardize the product name as **KanbanFlow** in browser titles, application defaults, package metadata, and component documentation.
- Rename the GitHub repository to **Web-KanbanFlow** and update repository/setup links; the local folder rename is pending.
- Preserve release history and dependency versions.


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
