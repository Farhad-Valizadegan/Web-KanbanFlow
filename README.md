# KanbanFlow

KanbanFlow is a web application for organizing collaborative work into workspaces, projects, boards, columns, and tasks. It combines a Laravel API with a React and TypeScript interface, MySQL persistence, and Laravel Sanctum session authentication.

The repository is named **Web-KanbanFlow**; the application name is **KanbanFlow**.

## Start here

- [Run the local demo](#run-the-local-demo)
- [Features](#features)
- [Verification](#verification)
- [Documentation](docs/README.md)
- [Release history](docs/Releases/README.md) and [changelog](CHANGELOG.md)
- [Known limitations](#known-limitations)

## Version and status

The frontend package declares version **1.1.1**. Consult release records and Git tags for published versions; a package version does not identify the source running on a server.

Workspace collaboration, Kanban workflows, comments, notifications, analytics, and light/dark themes are implemented. Verification results belong to a particular commit and environment. This README does not certify a current passing CI run or production deployment.

## Features

| Area | Available behavior |
| --- | --- |
| Authentication | Registration, login, logout, session authentication, validation, and protected pages. |
| Workspaces | Workspace management, membership, and owner/manager/member/viewer roles. |
| Projects | Project management, workspace-scoped slugs, statuses, optional dates, and soft deletion. |
| Boards | Workspace/private visibility, ordered boards, drag-and-drop reordering, detailed and compact views. |
| Columns | Ordered workflow columns and optional active-task Work in Progress (WIP) limits. |
| Tasks | Priorities, descriptions, due dates, assignment, completion, ordering, and movement between columns. |
| Collaboration | Task comments, author controls, moderation, and workspace activity feeds/filtering. |
| Notifications | Assignment notifications, unread counts/filtering, read/delete actions, and recipient isolation. |
| Analytics | Workspace/project/task summaries, priority counts, overdue/upcoming work, and assigned-to-me views. |
| Interface | Shared navigation, loading/error states, optimistic movement with rollback, and light/dark appearance preferences. |

Active tasks count toward column WIP limits. Completed tasks do not; reopening a task must respect available capacity. Dedicated movement endpoints handle ordering rather than ordinary task updates.

## Technology and prerequisites

| Component | Baseline |
| --- | --- |
| Backend | Laravel 13, Sanctum 4, PHP manifest requirement `^8.3`; CI uses PHP 8.4. |
| Database | MySQL for the documented local setup; backend tests use SQLite. |
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4. |
| Client libraries | Axios, TanStack Query, React Router, React Hook Form, Zod, and dnd-kit. |
| Tools | Composer 2, Node.js 24 (CI baseline), npm, and Git. |

Use the committed lockfiles for exact dependency versions. Installed PHP must satisfy all locked packages and required extensions, including the MySQL PDO driver for the local database. See the [dependency baseline](docs/SDLC/05-implementation/dependency-baseline.md).

On Windows, XAMPP can supply MySQL and a compatible PHP installation. Check `php -v`: an older bundled PHP may need upgrading. The demo below runs the API and frontend in separate terminals.

## Run the local demo

These steps initialize a **new local installation**. For an existing installation, preserve its environment file, application key, and database; follow the [upgrade and rollback guide](docs/Releases/upgrade-and-rollback.md).

### 1. Get the source and create the database

```bash
git clone https://github.com/Farhad-Valizadegan/Web-KanbanFlow.git
cd Web-KanbanFlow
```

Start MySQL, then create the database using your database administration tool:

```sql
CREATE DATABASE kanbanflow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

### 2. Configure the backend

From the repository root:

```bash
cd backend
composer install
```

Copy the example configuration in PowerShell:

```powershell
Copy-Item .env.example .env
```

On Linux/macOS, use `cp .env.example .env`. Edit the new `.env` to match your local database credentials and these development origins:

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanbanflow
DB_USERNAME=your_local_database_user
DB_PASSWORD=your_local_database_password
```

The example file uses local `root` credentials with an empty password; adjust them for your installation. Keep actual credentials out of Git.

Generate the key once for this new installation and create the schema:

```bash
php artisan key:generate
php artisan migrate
php artisan serve --host=localhost --port=8000
```

Leave this terminal running. The example configuration uses database-backed sessions, cache, and queues, so migrations and database access are required for normal application use.

### 3. Configure and start the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm ci
```

Copy its example configuration in PowerShell:

```powershell
Copy-Item .env.example .env
```

On Linux/macOS, use `cp .env.example .env`. Confirm the frontend setting:

```dotenv
VITE_API_URL=http://localhost:8000
```

Start the interface:

```bash
npm run dev -- --host localhost --port 5173 --strictPort
```

Open [the local demo](http://localhost:5173). Both terminals and MySQL must remain running.

### 4. Create an account and explore

Choose **Register** and create your own account. Then create a workspace, a project, a board, columns, and tasks. Try assigning a task, moving it between columns, setting a WIP limit, adding a comment, and switching appearance modes.

There is no universal demo username/password created by the installation steps. Existing installations retain their own accounts. Running the database seeder is not required for this walkthrough, and the interface currently has no password-recovery flow.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| Frontend cannot reach the API | Keep the backend terminal running; confirm `VITE_API_URL` and restart Vite after editing it. |
| Login/session or CSRF failures | Use `localhost` consistently; check frontend/backend origins and Sanctum stateful domains. Inspect the failed request before changing credentials. |
| Database/session/cache errors | Start MySQL, verify database credentials, and run pending migrations. |
| Port already in use | Stop the conflicting service or update the affected ports and origin configuration together. |
| Configuration change appears ignored | Run `php artisan optimize:clear` from `backend` and restart affected development servers. |
| Build/dependency installation fails | Check PHP/Node versions and lockfile requirements against the dependency baseline. |

Do not use `php artisan migrate:fresh` to troubleshoot an existing database: it drops tables and their data.

## Repository layout

```text
Web-KanbanFlow/
├── .github/workflows/ci.yml
├── backend/                 Laravel API, migrations, policies, and tests
├── frontend/                React application and frontend tooling
├── docs/
│   ├── Project-Definition/
│   ├── Project-Management/
│   │   └── Milestones/
│   ├── Releases/
│   ├── SDLC/                Eight lifecycle phases
│   ├── Sprints/
│   ├── diagram-guide.md
│   └── README.md
├── CHANGELOG.md
└── README.md
```

See the [repository layout reference](docs/SDLC/04-design/repository-layout.md) and [system architecture](docs/SDLC/04-design/system-architecture-diagram.md), including its PlantUML source and rendered diagram.

## Verification

Run backend checks from `backend`:

```bash
php artisan test
```

Run frontend checks from `frontend`:

```bash
npm run lint
npm test
npm run build
```

`npm run preview` serves a built frontend for local inspection; it still needs the API and compatible authentication configuration. It is not a production deployment procedure.

The [CI workflow](.github/workflows/ci.yml) configures backend tests on PHP 8.4 and frontend lint, session regression tests, and build on Node.js 24 for pushes and pull requests targeting `main`. Check [GitHub Actions](https://github.com/Farhad-Valizadegan/Web-KanbanFlow/actions) for results tied to the relevant commit.

Backend SQLite tests do not establish MySQL locking or contention behavior. Frontend lint/build do not verify browser journeys or accessibility; `npm test` covers the protected-route session boundary with controlled query outcomes, rather than complete browser journeys. Use the [manual acceptance checklist](docs/SDLC/06-testing/manual-acceptance-checklist.md), [automated test inventory](docs/SDLC/06-testing/automated-test-inventory.md), and [verification record template](docs/SDLC/06-testing/verification-record-template.md) to record actual results and limitations.

## Authorization and data boundaries

Workspace membership governs access. Owners and managers manage resources within endpoint-specific restrictions; members and viewers can read permitted data. Private boards also restrict visibility. Comment actions depend on authorship, current board access, and moderation rules. Notifications belong to their authenticated recipient.

Nested-resource checks protect workspace/project/board/column/task relationships. Actual controller and policy paths determine authority; a policy method alone does not establish that every endpoint invokes it. See [authentication and authorization](docs/SDLC/04-design/authentication-and-authorization.md) and the [security regression matrix](docs/SDLC/06-testing/security-regression-matrix.md).

## Known limitations

- Membership changes are owner-only, including adding and removing users, to prevent indirect role changes. See [DEC-003](docs/Project-Management/decision-register.md) and [PB-001](docs/Project-Management/product-backlog.md).
- Attachment uploads, PDF/export, public sharing, and password-change/recovery flows are proposed documentation topics, not implemented application endpoints.
- Soft deletion does not establish a general descendant restore or permanent-erasure workflow.
- Production hosting, operational monitoring, backup schedules, and recovery targets require target-specific setup and verification.

## Documentation

| Section | Purpose |
| --- | --- |
| [Project Definition](docs/Project-Definition/README.md) | Problem, goals, scope, stakeholders, constraints, and success criteria. |
| [Project Management](docs/Project-Management/README.md) | Backlog, decisions, roadmap, quality/risk, traceability, and milestones. |
| [SDLC](docs/SDLC/README.md) | Planning, requirements, analysis, design, implementation, testing, deployment, and maintenance. |
| [Sprints](docs/Sprints/README.md) | Planning, readiness/completion criteria, progress, review, and retrospective records. |
| [Releases](docs/Releases/README.md) | Release history, preparation, verification, upgrades, and rollback. |
| [Diagram guide](docs/diagram-guide.md) | Maintain PlantUML sources and rendered previews together. |

Historical milestones and release records preserve their original scope. Use current candidate/environment evidence when assessing readiness.

## Contributing changes

Start with the [development workflow](docs/SDLC/05-implementation/development-workflow.md). Keep changes scoped, update affected documentation and diagrams, run relevant checks, and describe the observed results and remaining gaps. Use the [release pipeline](docs/Project-Management/release-pipeline.md) for publication; publishing source and deploying a running application are separate operations.

## License

Copyright © 2026 Farhad Valizadegan. All rights reserved.

This repository and its source code are provided solely for portfolio review. No permission is granted to copy, use, modify, distribute, publish, sublicense, sell, or create derivative works from any part of this project without the author's prior written permission.

The backend Composer manifest declares `proprietary`, consistent with these repository terms. Third-party dependencies retain their own licenses.
