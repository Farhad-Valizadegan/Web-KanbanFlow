# Testing

## Purpose and activities

Run relevant backend tests, frontend lint, and production build. Current CI runs backend tests and frontend lint/build on main pushes and pull requests into main. Backend tests use in-memory SQLite; MySQL contention and browser usability require separate checks.

## Completion evidence

Evidence tied to the tested commit and environment, including failures and unverified boundaries. Do not infer usability or MySQL concurrency correctness from build or SQLite success.

## Related guidance

- [Supporting documentation](../../Project-Management/quality-and-risk-plan.md)
- [SDLC index](../README.md)

## PlantUML workflow

![Testing workflow](diagrams/workflow.png)

[Editable source](diagrams/workflow.puml)

```plantuml
@startuml
title KanbanFlow Testing
rectangle "Inputs and context" as I
rectangle "Testing work" as W
rectangle "Review evidence" as R
rectangle "Phase outputs" as O
I --> W
W --> R
R --> O
R --> W : unresolved questions
@enduml
```