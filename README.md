# KanbanFlow

A full-stack Kanban project management system built with Laravel, React, TypeScript, MySQL, Tailwind CSS, and dnd-kit.

KanbanFlow provides authenticated workspace collaboration, project management, interactive Kanban boards, task assignment, drag-and-drop ordering, Work in Progress limits, role-based authorization, comments, activity tracking, notifications, and workspace analytics.

## Version

Current version:

```text
Version 1.0.2
```

Development status:

```text
Feature complete
Backend tests passing
Frontend lint passing
Frontend production build passing
GitHub Actions configured for pushes and pull requests
```

Patch-release changes and known issues are documented in [CHANGELOG.md](CHANGELOG.md).

## Features

### Authentication

- User registration
- User login and logout
- Laravel Sanctum SPA authentication
- Authenticated-user endpoint
- Persistent sessions
- Protected frontend routes
- Protected dashboard
- Backend and frontend validation

### Workspace Management

- Create, view, update, and delete workspaces
- Workspace ownership
- Workspace member management
- Add and remove members
- Change member roles
- Workspace-scoped authorization
- Owner, manager, member, and viewer roles

### Project Management

- Create, view, update, and delete projects
- Workspace-scoped project slugs
- Active, completed, and archived statuses
- Optional start and due dates
- Soft deletion
- Soft-delete slug collision protection

### Kanban Boards

- Create, view, update, and delete boards
- Project-scoped board slugs
- Workspace and private board visibility
- Soft deletion
- Board position ordering
- Drag-and-drop board reordering
- Detailed board mode
- Compact overview mode
- Per-board view preference stored locally

### Workflow Columns

- Create, view, update, and delete columns
- Column position ordering
- Drag-and-drop column reordering
- Optional Work in Progress limits
- Active-task WIP enforcement
- Completed-task WIP handling

### Task Management

- Create, view, update, and delete tasks
- Low, medium, high, and urgent priorities
- Optional descriptions and due dates
- Task assignment and reassignment
- Task unassignment
- Open and completed states
- Task position ordering
- Drag-and-drop ordering within columns
- Drag-and-drop movement between columns
- Destination-column validation
- Optimistic frontend updates
- Rollback after failed movement

### Collaboration

- Task comment creation, listing, editing, and deletion
- Comment authorship and timestamps
- Comment authorization and moderation
- Comment soft deletion
- Workspace activity logging
- Structured activity metadata
- Activity filtering
- Workspace activity feed

### Notifications

- Database notifications
- Task assignment notifications
- Task reassignment notifications
- Self-assignment notification prevention
- Duplicate notification prevention
- Notification listing
- Unread-only filtering
- Unread notification count
- Mark one notification as read
- Mark all notifications as read
- Delete notifications
- Authenticated-user notification isolation
- Automatic frontend polling

### Workspace Analytics

- Workspace summary statistics
- Project status counts
- Task status counts
- Task priority counts
- Overdue-task tracking
- Due-today tracking
- Upcoming tasks
- Tasks assigned to the authenticated user
- Workspace-scoped analytics authorization

## Technology Stack

### Backend

- PHP 8.4
- Laravel 13
- Laravel Sanctum 4
- MySQL
- PHPUnit 12

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

### Development and Automation

- Git
- GitHub
- GitHub Actions
- Composer
- npm
- ESLint
- Laravel Pint

## Project Structure

```text
Web-KanbanFlow/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── .env.example
│   └── composer.json
├── docs/
│   ├── MILESTONE_5.md
│   ├── MILESTONE_6.md
│   ├── MILESTONE_7.md
│   └── MILESTONE_8.md
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Prerequisites

Install the following software before running the application:

- PHP 8.3 or later
- Composer 2
- MySQL 8 or MariaDB
- Node.js 24
- npm
- Git

For Windows development, XAMPP can provide PHP and MySQL.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Farhad-Valizadegan/Web-KanbanFlow.git
cd Web-KanbanFlow
```

### 2. Create the Database

Start MySQL and create a database named:

```text
kanbanflow
```

Example SQL:

```sql
CREATE DATABASE kanbanflow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

### 3. Configure the Backend

Enter the backend directory:

```bash
cd backend
```

Install PHP dependencies:

```bash
composer install
```

Create the local environment file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux or macOS:

```bash
cp .env.example .env
```

Generate the Laravel application key:

```bash
php artisan key:generate
```

The default local database configuration is:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanbanflow
DB_USERNAME=root
DB_PASSWORD=
```

Update these values in `backend/.env` if your local MySQL configuration is different.

Run the database migrations:

```bash
php artisan migrate
```

### 4. Configure the Frontend

Return to the repository root and enter the frontend directory:

```bash
cd ../frontend
```

Install JavaScript dependencies:

```bash
npm install
```

Create the frontend environment file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux or macOS:

```bash
cp .env.example .env
```

The frontend API URL should be:

```env
VITE_API_URL=http://localhost:8000
```

## Running the Application

The backend and frontend must run in separate terminals.

### Backend Server

From the `backend` directory:

```bash
php artisan serve
```

The backend will be available at:

```text
http://localhost:8000
```

### Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

## Backend Commands

Run the complete backend test suite:

```bash
php artisan test
```

Clear Laravel configuration and application caches:

```bash
php artisan optimize:clear
```

Run pending migrations:

```bash
php artisan migrate
```

Rebuild the database for local development:

```bash
php artisan migrate:fresh
```

Format backend code:

```bash
vendor/bin/pint
```

## Frontend Commands

Run the development server:

```bash
npm run dev
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Testing

### Backend Verification

The complete backend suite currently contains:

```text
160 tests passed
459 assertions passed
```

Verified areas include:

- Authentication
- Workspace management
- Workspace membership
- Project management
- Board management
- Column management
- Task management
- Board, column, and task movement
- WIP-limit enforcement
- Soft-delete slug protection
- Position normalization
- Task comments
- Activity logging
- Task assignment notifications
- Notification authorization
- Notification ownership isolation
- Workspace analytics authorization
- Workspace analytics scoping
- Upcoming-task ordering
- Assigned-to-me filtering

### Frontend Verification

The frontend verification currently reports:

```text
ESLint passed
TypeScript build passed
Vite production build passed
242 modules transformed
```

Route-based code splitting reduced the largest JavaScript bundle from:

```text
556.69 kB
159.69 kB gzip
```

to:

```text
314.40 kB
101.94 kB gzip
```

The previous Vite large-chunk warning is no longer reported.

## Continuous Integration

GitHub Actions configuration is located at:

```text
.github/workflows/ci.yml
```

The workflow runs automatically for:

- Pull requests targeting `main`
- Pushes to `main`

It contains two independent jobs.

### Backend Tests

The backend job:

- Runs on Ubuntu
- Uses PHP 8.4
- Installs Composer 2
- Enables SQLite extensions
- Restores cached Composer dependencies
- Installs locked dependencies
- Creates the Laravel environment file
- Generates an application key
- Runs the complete backend test suite

### Frontend Build and Lint

The frontend job:

- Runs on Ubuntu
- Uses Node.js 24
- Restores cached npm dependencies
- Installs dependencies with `npm ci`
- Runs ESLint
- Runs the TypeScript and Vite production build

Both GitHub Actions jobs currently pass.

## Authorization Model

Workspace access is controlled through four roles:

- `owner`
- `manager`
- `member`
- `viewer`

General permissions:

- Owners can fully manage workspaces, members, projects, boards, columns, and tasks.
- Managers can manage projects, boards, columns, tasks, and workspace members within policy restrictions.
- Members and viewers can access permitted workspace data but cannot perform protected management operations.
- Comment authors can modify their own comments according to policy rules.
- Workspace owners and managers can moderate comments.
- Notifications are private to their authenticated recipient.
- Workspace analytics are available only to workspace members.

Nested-resource validation prevents records from one workspace, project, board, column, task, or comment from being accessed through a mismatched route.

## Ordering Model

Boards, columns, and tasks use dedicated movement endpoints.

Standard update endpoints do not accept position changes.

Ordering behavior includes:

- One-based positions
- Position clamping
- Sequential position normalization
- Database transactions
- Row locking during reorder operations
- Protection against duplicate positions
- Optimistic frontend updates
- Query invalidation after successful movement
- Cache restoration after failed movement

## Work in Progress Limits

Columns can optionally define a Work in Progress limit.

The backend enforces the following rules:

- Active tasks cannot be created when a column is full.
- Active tasks cannot be moved into a full column.
- Completed tasks do not count toward the active WIP total.
- A completed task cannot be reopened when doing so would exceed the limit.
- WIP limits must be positive whole numbers.

## Frontend Architecture

The frontend uses route-based lazy loading.

The following pages are loaded dynamically:

- Home page
- Login page
- Registration page
- Dashboard page
- Workspace page
- Project page
- Board page

React `Suspense` displays a loading state while route modules are downloaded.

TanStack Query manages:

- Server-state caching
- Queries and mutations
- Cache invalidation
- Optimistic updates
- Rollback after failed operations

## Milestones

### Milestone 1 – Project Foundation

Status: Completed

- Laravel backend
- React and TypeScript frontend
- MySQL integration
- Laravel Sanctum
- Tailwind CSS
- Axios
- TanStack Query
- React Router
- Frontend and backend environment configuration
- CORS configuration
- Frontend-to-backend health check
- Git repository setup

### Milestone 2 – Authentication

Status: Completed

- Registration
- Login
- Logout
- Session persistence
- Protected routes
- Protected dashboard
- Authentication validation and tests

### Milestone 3 – Workspace and Project Management

Status: Completed

- Workspace CRUD
- Workspace membership
- Role management
- Workspace authorization
- Project CRUD
- Project statuses and dates
- Project soft deletion
- Backend and frontend integration

### Milestone 4 – Kanban Boards and Tasks

Status: Completed

- Board CRUD and ordering
- Column CRUD and ordering
- Task CRUD and ordering
- Drag-and-drop interactions
- WIP limits
- Detailed and overview board modes
- Optimistic updates and rollback

### Milestone 5 – Collaboration and Activity Tracking

Status: Completed

- Task comments
- Comment authorization
- Comment moderation
- Activity logging
- Activity filtering
- Workspace activity feed

Detailed documentation:

- [Milestone 5](docs/MILESTONE_5.md)

### Milestone 6 – Notifications

Status: Completed

- Assignment and reassignment notifications
- Notification listing
- Unread filtering and counts
- Mark-as-read operations
- Notification deletion
- Notification ownership isolation
- Dashboard notification panel

Detailed documentation:

- [Milestone 6](docs/MILESTONE_6.md)

### Milestone 7 – Workspace Analytics and Task Assignment

Status: Completed

- Workspace statistics
- Project, task, and priority counts
- Overdue and due-today tracking
- Upcoming tasks
- Assigned-to-me tasks
- Task assignment, reassignment, and unassignment
- Analytics dashboard

Detailed documentation:

- [Milestone 7](docs/MILESTONE_7.md)

### Milestone 8 – Production Readiness and Continuous Integration

Status: Completed

- GitHub Actions workflow
- Automated backend tests
- Automated frontend lint and build
- Composer and npm dependency caching
- Route-based code splitting
- Reduced frontend bundle size
- Successful local and remote CI verification

Detailed documentation:

- [Milestone 8](docs/MILESTONE_8.md)

## Milestone Completion

All planned Version 1.0.0 milestones are complete:

- Milestone 1 – Project Foundation
- Milestone 2 – Authentication
- Milestone 3 – Workspace and Project Management
- Milestone 4 – Kanban Boards and Tasks
- Milestone 5 – Collaboration and Activity Tracking
- Milestone 6 – Notifications
- Milestone 7 – Workspace Analytics and Task Assignment
- Milestone 8 – Production Readiness and Continuous Integration

## Security

- Laravel Sanctum protects authenticated API endpoints.
- Laravel policies enforce resource authorization.
- Request validation protects API input.
- Nested-route ownership is validated.
- Passwords are securely hashed by Laravel.
- Notification records are isolated by authenticated recipient.
- Environment files containing secrets are excluded from Git.
- Example environment files contain no private credentials.

## License

Copyright © 2026 Farhad Valizadegan. All rights reserved.

This repository and its source code are provided solely for portfolio review. No permission is granted to copy, use, modify, distribute, publish, sublicense, sell, or create derivative works from any part of this project without the author's prior written permission.
