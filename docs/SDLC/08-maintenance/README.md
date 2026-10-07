# Maintenance

## Purpose and activities

Collect reproducible defects and user feedback, prioritize risks, and maintain dependencies and documentation. Verify changes before release. Track the manager remove/re-add loophole until the policy is decided and enforcement is tested.

## Completion evidence

A maintained backlog, current known issues, scoped fixes, and release evidence. Historical release claims stay separate from current verification.

## Related guidance

- [Supporting documentation](../../Releases/README.md)
- [SDLC index](../README.md)

## PlantUML workflow

![Maintenance workflow](diagrams/workflow.png)

[Editable source](diagrams/workflow.puml)

```plantuml
@startuml
title KanbanFlow Maintenance
rectangle "Inputs and context" as I
rectangle "Maintenance work" as W
rectangle "Review evidence" as R
rectangle "Phase outputs" as O
I --> W
W --> R
R --> O
R --> W : unresolved questions
@enduml
```