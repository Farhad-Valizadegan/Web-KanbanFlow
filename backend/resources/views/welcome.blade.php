<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'KanbanFlow') }}</title>
    </head>
    <body>
        <main>
            <h1>KanbanFlow</h1>
            <p>Collaborative workspaces, projects, and Kanban boards.</p>
            <a href="{{ config('cors.allowed_origins.0', 'http://localhost:5173') }}">Open KanbanFlow</a>
        </main>
    </body>
</html>
