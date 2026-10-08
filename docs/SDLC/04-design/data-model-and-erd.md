# KanbanFlow Data Model and ERD

## Scope and design

The core containment chain is Workspace → Project → Board → Column → Task → TaskComment. Users own workspaces, participate through `workspace_user`, create resources, and may be assigned tasks. Activity logs associate with workspace/user; notifications have their own recipient storage.

Use migrations for physical keys, nullability, indices, and delete actions; use models for relationships, casts, and soft deletion. Conceptual containment does not specify every cardinality or physical foreign key. Do not infer a task foreign key for activity logs.

Review any schema change for existing rows, authorization scope, migration failure, backup, and rollback consequences. Soft deletion and physical cascading are distinct operations. See the analysis domain model for the broader relationship discussion.

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

![Data Model and ERD](diagrams/data-model-and-erd.png)

[Editable PlantUML source](diagrams/data-model-and-erd.puml)

```plantuml
@startuml
title KanbanFlow Conceptual Entity Relationships
hide methods
entity User
entity Workspace
entity workspace_user
entity Project
entity Board
entity Column
entity Task
entity TaskComment
entity ActivityLog
User -- Workspace : owner_id
User -- workspace_user : member
Workspace -- workspace_user : membership role
Workspace -- Project : contains
Project -- Board : contains
Board -- Column : contains
Column -- Task : contains
Task -- TaskComment : contains
User -- Task : creator / optional assignee
User -- TaskComment : author
Workspace -- ActivityLog : scope
User -- ActivityLog : actor
note bottom : Migrations define physical keys and delete behavior.
@enduml
```
