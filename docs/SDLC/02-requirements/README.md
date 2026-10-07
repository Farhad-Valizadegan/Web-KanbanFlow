# Requirements

## Purpose and activities

Write observable outcomes and acceptance criteria. Include role permissions, validation, failure behavior, persistence, and accessibility where relevant. Distinguish delivered behavior from proposed changes.

## Completion evidence

Requirements linked to a user need, agreed policy, and verification method. Resolve ambiguous permission rules before implementation.

## Related guidance

- [Supporting documentation](../../Project-Definition/scope-and-stakeholders.md)
- [SDLC index](../README.md)

## PlantUML workflow

![Requirements workflow](diagrams/workflow.png)

[Editable source](diagrams/workflow.puml)

```plantuml
@startuml
title KanbanFlow Requirements
rectangle "Inputs and context" as I
rectangle "Requirements work" as W
rectangle "Review evidence" as R
rectangle "Phase outputs" as O
I --> W
W --> R
R --> O
R --> W : unresolved questions
@enduml
```