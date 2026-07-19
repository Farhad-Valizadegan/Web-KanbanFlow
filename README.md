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

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- TanStack Query
- React Router

## Project Status

### Milestone 1 - Project Foundation

Status: Completed

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

### Milestone 2 - Authentication

Status: Completed

- User registration
- User login
- User logout
- Authenticated user endpoint
- Session persistence
- Protected frontend routes
- Protected dashboard
- Authentication validation
- Authentication tests

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
