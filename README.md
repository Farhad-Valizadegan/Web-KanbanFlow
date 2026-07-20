# Web Kanban Project Management System

A full-stack project management application built with Laravel, React, TypeScript, MySQL, Tailwind CSS, and dnd-kit.

The application supports authenticated workspace collaboration, project management, Kanban boards, workflow columns, task management, drag-and-drop ordering, WIP limits, role-based authorization, and compact board overview mode.

## Technology Stack

### Backend

- PHP 8.4
- Laravel 13
- Laravel Sanctum
- MySQL
- PHPUnit

### Frontend

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- Axios
- TanStack Query
- React Router
- React Hook Form
- Zod
- dnd-kit

## Project Status

### Milestone 1 - Project Foundation

Status: Completed

Completed features:

- Laravel backend setup
- React and TypeScript frontend setup
- MySQL database integration
- Laravel migrations
- Laravel Sanctum installation
- Tailwind CSS setup
- Axios API client
- TanStack Query setup
- React Router setup
- Frontend environment configuration
- Backend CORS configuration
- Frontend-to-backend health check
- Git repository setup

Dependencies installed during this milestone:

#### Backend

- `laravel/framework`
- `laravel/sanctum`
- `laravel/tinker`
- `fakerphp/faker`
- `mockery/mockery`
- `phpunit/phpunit`
- `nunomaduro/collision`
- `laravel/pint`

#### Frontend

- `react`
- `react-dom`
- `typescript`
- `vite`
- `@vitejs/plugin-react`
- `tailwindcss`
- `@tailwindcss/vite`
- `axios`
- `@tanstack/react-query`
- `react-router-dom`
- `eslint`
- `typescript-eslint`

### Milestone 2 - Authentication

Status: Completed

Completed features:

- User registration
- User login
- User logout
- Authenticated user endpoint
- Session persistence
- Protected frontend routes
- Protected dashboard
- Authentication validation
- Authentication tests

Dependencies used for this milestone:

#### Backend

- `laravel/sanctum` for SPA authentication
- `phpunit/phpunit` for authentication feature tests
- `fakerphp/faker` for test data

#### Frontend

- `axios` for authentication API requests
- `@tanstack/react-query` for authentication state and server-state caching
- `react-router-dom` for protected routes and navigation
- `react-hook-form` for form handling
- `zod` for validation schemas
- `@hookform/resolvers` for React Hook Form and Zod integration

### Milestone 3 - Workspace and Project Management

Status: Completed

#### Workspace features

- Workspace creation, listing, viewing, updating, and deletion
- Workspace ownership and visibility
- Workspace slug generation
- Workspace member listing
- Add and remove workspace members
- Update workspace member roles
- Owner, manager, member, and viewer roles
- Workspace authorization policies
- Workspace API tests
- Workspace frontend integration

#### Project features

- Project creation, listing, viewing, updating, and deletion
- Soft deletion
- Active, completed, and archived statuses
- Optional start and due dates
- Due-date validation
- Workspace-scoped project slugs
- Project authorization policies
- Project API tests
- Project frontend integration
- Project empty state
- Project date formatting
- Automatic query refresh after creation and deletion
- Soft-delete slug collision protection

Dependencies used for this milestone:

#### Backend

- `laravel/framework` for models, controllers, policies, validation, routing, migrations, factories, and Eloquent relationships
- `laravel/sanctum` for authenticated workspace and project API access
- `phpunit/phpunit` for workspace, member, and project feature tests
- `fakerphp/faker` for workspace and project factories

#### Frontend

- `axios` for workspace, member, and project API requests
- `@tanstack/react-query` for queries, mutations, cache invalidation, and optimistic updates
- `react-router-dom` for dashboard and workspace navigation
- `react-hook-form` for structured forms
- `zod` for frontend validation
- `@hookform/resolvers` for form-schema integration
- `tailwindcss` for the dashboard, workspace, member, and project interfaces

### Milestone 4 - Kanban Boards and Tasks

Status: Completed

#### Board features

- Board creation, listing, viewing, updating, and deletion
- Boards scoped to projects
- Workspace and private visibility
- Project-scoped board slug generation
- Soft deletion
- Soft-delete slug collision protection
- Board position ordering
- Dedicated board move endpoint
- Drag-and-drop board reordering
- Optimistic frontend board updates
- Board authorization policies
- Owner and manager board management permissions
- Board API tests

#### Column features

- Column creation, listing, viewing, updating, and deletion
- Columns scoped to boards
- Column position ordering
- Dedicated column move endpoint
- Drag-and-drop column reordering
- Optimistic frontend column updates
- Optional WIP limits
- Column authorization policies
- Owner and manager column management permissions
- Column API tests

#### Task features

- Task creation, listing, viewing, updating, and deletion
- Tasks scoped to columns
- Low, medium, high, and urgent priorities
- Optional descriptions
- Optional due dates
- Optional assignees
- Open and completed states
- Task position ordering
- Dedicated task move endpoint
- Drag-and-drop task reordering inside a column
- Drag-and-drop movement between columns
- Destination-column validation
- WIP-limit enforcement
- Completed-task WIP handling
- Task authorization policies
- Owner and manager task management permissions
- Task API tests

#### Board interface features

- Detailed board mode
- Compact overview mode
- Per-board view preference stored in local storage
- Wider board layout in overview mode
- Compact columns in overview mode
- Compact task cards in overview mode
- Full task details in detailed mode
- Board drag-and-drop
- Column drag-and-drop
- Task drag-and-drop
- Loading, validation, authorization, and error messages
- Optimistic ordering updates
- Cache rollback when movement fails

Dependencies used for this milestone:

#### Backend

- `laravel/framework` for Kanban models, controllers, policies, validation, transactions, ordering, and soft deletion
- `laravel/sanctum` for authenticated Kanban API access
- `phpunit/phpunit` for board, column, task, movement, authorization, and WIP-limit feature tests
- `fakerphp/faker` for Kanban test data

#### Frontend

- `@dnd-kit/core` for drag-and-drop sensors and contexts
- `@dnd-kit/sortable` for sortable board, column, and task lists
- `@dnd-kit/utilities` for drag transform styling
- `axios` for Kanban API requests
- `@tanstack/react-query` for queries, mutations, invalidation, optimistic updates, and rollback
- `react-router-dom` for board navigation
- `tailwindcss` for detailed and overview Kanban interfaces

## Authorization Model

Workspace access is controlled through the following roles:

- `owner`
- `manager`
- `member`
- `viewer`

General permissions:

- Owners can fully manage the workspace, members, projects, boards, columns, and tasks.
- Managers can manage projects, boards, columns, tasks, and workspace members within policy restrictions.
- Members and viewers can access permitted workspace data but cannot perform protected management operations.
- Resource nesting is validated so records from another workspace, project, board, or column cannot be accessed through mismatched routes.

## Ordering Model

Boards, columns, and tasks use dedicated move endpoints.

Standard update endpoints do not accept position changes.

Ordering behavior includes:

- One-based positions
- Position clamping to valid ranges
- Sequential position normalization
- Database transactions
- Row locking during reorder operations
- Protection against duplicate or inconsistent positions
- Optimistic frontend updates
- Automatic query invalidation after successful movement
- Cache restoration after failed movement

## WIP Limits

Columns can optionally define a Work in Progress limit.

The backend enforces these rules:

- Active tasks cannot be created when the column is full.
- Active tasks cannot be moved into a full column.
- Completed tasks do not count toward the active WIP total.
- A completed task cannot be reopened when doing so would exceed the WIP limit.
- WIP limits must be positive whole numbers.

## Installed Dependency Inventory

### Backend runtime dependencies

- `php`: `^8.3`
- `laravel/framework`: `^13.8`
- `laravel/sanctum`: `^4.0`
- `laravel/tinker`: `^3.0`

### Backend development dependencies

- `fakerphp/faker`: `^1.23`
- `laravel/pail`: `^1.2.5`
- `laravel/pao`: `^1.0.6`
- `laravel/pint`: `^1.27`
- `mockery/mockery`: `^1.6`
- `nunomaduro/collision`: `^8.6`
- `phpunit/phpunit`: `^12.5.12`

### Frontend runtime dependencies

- `@dnd-kit/core`: `^6.3.1`
- `@dnd-kit/sortable`: `^10.0.0`
- `@dnd-kit/utilities`: `^3.2.2`
- `@hookform/resolvers`: `^5.4.0`
- `@tailwindcss/vite`: `^4.3.2`
- `@tanstack/react-query`: `^5.101.2`
- `axios`: `^1.18.1`
- `react`: `^19.2.7`
- `react-dom`: `^19.2.7`
- `react-hook-form`: `^7.81.0`
- `react-router-dom`: `^7.18.1`
- `tailwindcss`: `^4.3.2`
- `zod`: `^4.4.3`

### Frontend development dependencies

- `@eslint/js`: `^10.0.1`
- `@types/node`: `^24.13.2`
- `@types/react`: `^19.2.17`
- `@types/react-dom`: `^19.2.3`
- `@vitejs/plugin-react`: `^6.0.3`
- `eslint`: `^10.6.0`
- `eslint-plugin-react-hooks`: `^7.1.1`
- `eslint-plugin-react-refresh`: `^0.5.3`
- `globals`: `^17.7.0`
- `typescript`: `~6.0.2`
- `typescript-eslint`: `^8.62.0`
- `vite`: `^8.1.1`

## Verification Status

### Backend

```text
105 tests passed
268 assertions passed