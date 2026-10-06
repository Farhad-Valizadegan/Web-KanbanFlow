# KanbanFlow

The Laravel API backend for KanbanFlow. The repository and local project folder are named **Web-KanbanFlow**.

See the [project README](../README.md) for complete installation, database, authentication, and release information.

## Development

From the backend directory, install locked dependencies with `composer install`, configure `.env` from `.env.example`, generate the application key, run migrations, and start the API with `php artisan serve`.

## Verification

- `php artisan test` runs the backend suite against in-memory SQLite.
- `vendor/bin/pint --test` checks PHP formatting.

The Composer package identifier is `farhad-valizadegan/kanbanflow`; the application's display name is **KanbanFlow**.
