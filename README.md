# Web Kanban Project Management System

A full-stack project management application built with Laravel, React, TypeScript, MySQL, and Tailwind CSS.

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

Dependencies used for this milestone:

#### Backend

- `laravel/framework` for models, controllers, policies, validation, routing, migrations, factories, and Eloquent relationships
- `laravel/sanctum` for authenticated workspace and project API access
- `phpunit/phpunit` for workspace, member, and project feature tests
- `fakerphp/faker` for workspace and project factories

#### Frontend

- `axios` for workspace, member, and project API requests
- `@tanstack/react-query` for queries, mutations, and cache invalidation
- `react-router-dom` for dashboard and workspace navigation
- `react-hook-form` for structured forms
- `zod` for frontend validation
- `@hookform/resolvers` for form-schema integration
- `tailwindcss` for the dashboard, workspace, member, and project interfaces

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

Backend:

```text
33 tests passed
81 assertions passed
```

Frontend:

```text
TypeScript build passed
Vite production build passed
```

## Next Milestone

### Milestone 4 - Kanban Boards and Tasks

Planned features:

- Boards inside projects
- Columns inside boards
- Tasks inside columns
- Task ordering
- Drag-and-drop task movement
- Task priorities
- Task due dates
- Task assignment
- Board, column, and task authorization
- Kanban backend API
- Kanban frontend interface
- Backend feature tests
- Frontend verification

Dependencies already installed for this milestone:

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

## Installation

### Requirements

- PHP 8.4 or newer
- Composer
- Node.js
- npm
- MySQL
- XAMPP or another local PHP environment

### Clone the repository

```bash
git clone https://github.com/Farhad-Valizadegan/Web-Kanban-Project-Management-System.git
cd Web-Kanban-Project-Management-System
```

## Backend Setup

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Configure the database in `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanbanflow
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations and start Laravel:

```bash
php artisan migrate
php artisan serve
```

Backend URL:

```text
http://127.0.0.1:8000
```

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Testing

Run backend tests from the backend directory:

```powershell
cd backend
php artisan test
```

Run the frontend production build from the repository root:

```powershell
npm.cmd --prefix frontend run build
```

## Git Workflow

The project uses feature branches and pull requests.

Examples:

```text
feature/authentication
feature/workspaces-backend
feature/workspaces-frontend
feature/project-boards-backend
feature/project-boards-frontend
feature/kanban-boards-backend
feature/kanban-boards-frontend
```

## License

This project is intended for educational and portfolio purposes.
