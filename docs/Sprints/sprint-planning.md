# Sprint Planning

## Inputs

Use the refined backlog, known risks, available capacity, and previous review outcomes. Clarify the manager membership policy before scheduling a permission fix that depends on it.

## Planning steps

1. Agree a single coherent sprint goal.
2. Select items that support the goal and identify dependencies.
3. Define acceptance criteria and checks.
4. Agree participants, owners, dates, and capacity without inventing estimates.
5. Record exclusions and unresolved decisions.

## Outputs

An agreed goal and a sprint backlog with dependencies, acceptance criteria, and actual owners. Scope changes require a visible decision.

## Related guidance

- [Sprint index](README.md)
- [Management sprint workflow](../Project-Management/sprint-workflow.md)

## PlantUML diagram

![Sprint Planning diagram](diagrams/sprint-planning.png)

[Editable source](diagrams/sprint-planning.puml)

```plantuml
@startuml
title Sprint Planning
rectangle "Refined backlog" as N0
rectangle "Agree goal" as N1
rectangle "Select items" as N2
rectangle "Confirm capacity" as N3
rectangle "Sprint plan" as N4
N0 --> N1
N1 --> N2
N2 --> N3
N3 --> N4
@enduml
```