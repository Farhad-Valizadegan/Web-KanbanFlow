# Analysis

## Purpose and activities

Trace affected frontend/backend flows, database records, API boundaries, and current tests. Reproduce defects and identify their cause before choosing a fix. Assess sessions, authorization, WIP limits, and concurrent ordering when affected.

## Completion evidence

An evidence-based impact assessment with dependencies, compatibility risks, and a scoped implementation approach.

## Related guidance

- [Supporting documentation](../../Project-Definition/project-context-diagram.md)
- [SDLC index](../README.md)

## PlantUML workflow

![Analysis workflow](diagrams/workflow.png)

[Editable source](diagrams/workflow.puml)

```plantuml
@startuml
title KanbanFlow Analysis
rectangle "Inputs and context" as I
rectangle "Analysis work" as W
rectangle "Review evidence" as R
rectangle "Phase outputs" as O
I --> W
W --> R
R --> O
R --> W : unresolved questions
@enduml
```