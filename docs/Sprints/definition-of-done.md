# Definition of Done

An item is done when its agreed outcome is demonstrated, relevant checks pass, scoped review is completed, and affected documentation is updated.

## Evidence checklist

- Identify the implemented commit and affected requirements.
- Record relevant backend tests and frontend lint/type/build results.
- Verify affected browser journeys or concurrency boundaries when applicable.
- Keep open defects and skipped checks explicit.
- Confirm no unrelated changes or secrets enter the change.

Backend SQLite tests do not establish MySQL contention behavior. Build success does not prove usability. Publishing and deploying remain separate authorized actions.

## Related guidance

- [Sprint index](README.md)
- [Management sprint workflow](../Project-Management/sprint-workflow.md)

## PlantUML diagram

![Definition of Done diagram](diagrams/definition-of-done.png)

[Editable source](diagrams/definition-of-done.puml)

```plantuml
@startuml
title Definition of Done
rectangle "Implemented change" as N0
rectangle "Relevant checks" as N1
rectangle "Review" as N2
rectangle "Documentation" as N3
rectangle "Done" as N4
N0 --> N1
N1 --> N2
N2 --> N3
N3 --> N4
@enduml
```