# Scope Boundary Diagram

Inside scope: application authentication, workspace collaboration, project planning, board workflows, task management, comments, activity, database notifications, and analytics.

Outside this working definition: billing, payroll, time tracking, third-party synchronization, offline editing, and email/SMS delivery. This planning boundary does not prevent future additions.

Before expanding scope, document the users, data, permission implications, and acceptance criteria of the proposed capability.

## PlantUML diagram

[Standalone source](diagrams/scope-boundary-diagram.puml)

```plantuml
@startuml
title Scope Boundary Diagram
rectangle "KanbanFlow scope" {
 rectangle "Authentication and membership" as A
 rectangle "Projects, boards, tasks" as W
 rectangle "Collaboration and analytics" as C
}
rectangle "Outside current definition" {
 rectangle "Billing and payroll" as P
 rectangle "Offline editing" as O
 rectangle "Third-party synchronization" as T
 rectangle "Email and SMS" as E
}
A --> W
W --> C
@enduml
```