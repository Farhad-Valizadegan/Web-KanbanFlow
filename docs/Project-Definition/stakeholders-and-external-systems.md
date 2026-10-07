# Stakeholders and External Systems

Workspace users access KanbanFlow through a browser. React calls the Laravel backend, and MySQL persists records. Operators configure the runtime and database.

Maintainers use GitHub and GitHub Actions for source history and CI. GitHub is development infrastructure rather than a dependency for ordinary task requests. Current notifications are database notifications; email, SMS, and external integrations are not promised.

## PlantUML diagram

[Standalone source](diagrams/stakeholders-and-external-systems.puml)

```plantuml
@startuml
title Stakeholders and External Systems
actor User
actor Maintainer
actor Operator
rectangle KanbanFlow as App
database MySQL as DB
cloud "GitHub and CI" as Git
User --> App : browser
App --> DB : persistence
Maintainer --> Git : development
Operator --> App : configuration
@enduml
```