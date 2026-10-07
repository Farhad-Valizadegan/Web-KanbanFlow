# Sprint Review Template

## Review agenda

1. Restate the agreed goal and selected items.
2. Demonstrate working behavior against acceptance criteria.
3. Present verification evidence and known limitations.
4. Record feedback, incomplete work, and follow-up backlog items.

## Outcome table

| Item | Demonstrated outcome | Commit or check | Result | Follow-up |
| --- | --- | --- | --- | --- |
| Actual item | Observed behavior | Evidence link | Verified or pending | Agreed action |

Do not mark defects closed based only on a demonstration that omits the relevant failing boundary. A review is not proof of deployment.

## Related guidance

- [Sprint index](README.md)
- [Management sprint workflow](../Project-Management/sprint-workflow.md)

## PlantUML diagram

![Sprint Review Template diagram](diagrams/sprint-review.png)

[Editable source](diagrams/sprint-review.puml)

```plantuml
@startuml
title Sprint Review Template
rectangle "Sprint goal" as N0
rectangle "Demonstrate outcomes" as N1
rectangle "Review evidence" as N2
rectangle "Record feedback" as N3
rectangle "Update backlog" as N4
N0 --> N1
N1 --> N2
N2 --> N3
N3 --> N4
@enduml
```