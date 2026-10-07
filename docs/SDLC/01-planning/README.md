# Planning

## Purpose and activities

Define the user problem, scope, priorities, dependencies, and risks before scheduling work. Use the existing management roadmap and backlog as proposals; do not infer committed dates or staffing.

## Completion evidence

A clear goal, scope boundaries, dependencies, and open decisions. Membership permissions remain an open policy question.

## Related guidance

- [Supporting documentation](../../Project-Management/roadmap.md)
- [SDLC index](../README.md)

## PlantUML workflow

![Planning workflow](diagrams/workflow.png)

[Editable source](diagrams/workflow.puml)

```plantuml
@startuml
title KanbanFlow Planning
rectangle "Inputs and context" as I
rectangle "Planning work" as W
rectangle "Review evidence" as R
rectangle "Phase outputs" as O
I --> W
W --> R
R --> O
R --> W : unresolved questions
@enduml
```