# KanbanFlow System Architecture Diagram

## Scope and design

KanbanFlow uses a React/TypeScript frontend with Vite, shared theme/layout/UI components, API helpers, and query state. A Laravel backend handles session authentication, API controllers, policies, validation, Eloquent persistence, and database notifications.

The browser crosses a configured HTTP session/API boundary; Laravel crosses the database boundary. MySQL is the relevant production-style contention target in existing project guidance. Local SQLite checks do not prove MySQL locking behavior. Database notifications do not establish email delivery or real-time streaming.

Document concrete deployment origins, runtime versions, cookie/security settings, backups, and recovery separately. Repository components are not evidence that those operational arrangements have been deployed or verified.

## Review and evidence

Record the candidate commit, actor, environment, affected source paths, proposed change, observed checks, and remaining questions. Link implementation and acceptance evidence; keep untested behavior explicit. This document adds no application feature or newly executed security/behavior test.

## Related guidance

- [Design catalog](README.md)
- [Requirements](../02-requirements/README.md)
- [Analysis](../03-analysis/README.md)
- [Decision register](../../Project-Management/decision-register.md)
- [Verification record](../../Releases/verification-template.md)
- [Diagram guide](../../diagram-guide.md)

## PlantUML diagram

![System Architecture Diagram](diagrams/system-architecture-diagram.png)

[Editable PlantUML source](diagrams/system-architecture-diagram.puml)

```plantuml
@startuml
title KanbanFlow System Boundaries
node Browser {
 component "React application" as UI
 component "Axios / Query state" as Client
 UI --> Client
}
node "Laravel application" {
 component "Session and API routes" as Routes
 component "Controllers / Validation / Policies" as Controls
 component "Eloquent persistence" as Models
 Routes --> Controls
 Controls --> Models
}
database "Application database" as DB
Client --> Routes : HTTP credentials / XSRF
Models --> DB : Resources and notifications
@enduml
```
