# Risks and Success Criteria

| Risk | Response |
| --- | --- |
| Manager remove/re-add bypasses role restrictions | Agree the membership policy and verify backend enforcement. |
| Session configuration prevents login | Verify authentication and existing-session redirects. |
| Concurrent moves violate WIP or ordering | Preserve transactional enforcement and relevant concurrency checks. |
| Failed mutations leave misleading UI state | Verify rollback and persisted state after refresh. |
| Documentation drifts | Review affected documents with implementation changes. |

Proposed acceptance criteria: complete the workspace-to-task journey; persist changes after refresh; enforce agreed role rules and WIP limits; support keyboard and narrow-screen use; and pass relevant lint, type, build, and backend checks. These are verification targets, not a claim that all risks are resolved.

## Evidence and unresolved decisions

Record the tested commit, environment, check results, and unresolved issues for each release. Passing a build does not establish usability or authorization correctness.

The membership policy decision is still open: determine which roles managers may add or remove, then verify that remove/re-add cannot bypass role-change restrictions.


## PlantUML diagram

![risks-and-success-criteria diagram](diagrams/risks-and-success-criteria.png)

[Standalone source](diagrams/risks-and-success-criteria.puml)

```plantuml
@startuml
title Risks and Success Criteria
rectangle "Identify risks" as I
rectangle "Agree criteria" as C
rectangle "Implement mitigation" as M
rectangle "Verify evidence" as V
rectangle "Release decision" as R
I --> C
C --> M
M --> V
V --> R
V --> M : unmet criteria
@enduml
```