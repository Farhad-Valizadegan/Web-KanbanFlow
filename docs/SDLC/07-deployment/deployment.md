# KanbanFlow Deployment Guide

## Scope and entry conditions

Identify the actual target, current running commit/assets, desired candidate, operator, authorized scope, and maintenance/traffic plan. Review the exact diff and release notes, runtime/dependency requirements, database compatibility, host/session configuration, and recovery evidence before changing the runtime.

The repository's CI runs tests and frontend lint/build; it does not automatically deploy the application. No hosting provider, production domain, service manager, or rollout topology is established by this guide.

## Pre-deployment checklist

- Confirm candidate SHA/tag and affected acceptance evidence; retain known issues and unverified boundaries.
- Match backend dependencies and frontend assets to the candidate's lockfiles and runtime requirements.
- Identify assessed migrations and old/new schema compatibility; do not assume migration reversal is safe.
- Preserve existing environment secrets and application key through a secure procedure.
- Verify backup availability and restore evidence appropriate to the operation's data risk.
- Establish traffic, service, worker, and cache procedures for the actual target.

## Execution controls

Use an isolated staging target to exercise the planned procedure first when appropriate. Apply only the reviewed source, assets, configuration, and migrations. Avoid destructive database reset commands and routine application-key regeneration on existing installations. Record each operational result and stop on a material failure rather than proceeding blindly.

Expose only the backend public entry point through the actual server configuration; keep environment files, private storage, and repository internals outside public access. Configure SPA route fallback for frontend navigation without turning API errors into HTML responses. Provider-specific commands must be selected and verified for the target rather than invented here.

## Completion evidence

Verify running identity, API reachability, database-dependent behavior, real sign-in/sign-out, relevant permissions/private resources, existing data, accepted/rejected task movements, and affected UI journeys. Observe relevant logs and configured background services. The health endpoint's successful response alone does not prove database readiness or the whole application.

Record exact target/candidate, timestamps, observed checks, failures, and residual issues in a [verification record](../../Releases/verification-template.md). If checks fail, use the assessed recovery procedure; a code rollback is not a data restore. Follow [release and upgrade runbook](release-and-upgrade-runbook.md).

## PlantUML diagram

![KanbanFlow deployment](diagrams/deployment.png)

[Editable PlantUML source](diagrams/deployment.puml)

```plantuml
@startuml
title KanbanFlow deployment
start
:Identify target, candidate, and authorization;
:Assess compatibility and recovery evidence;
:Apply reviewed source, assets, and changes;
:Observe smoke checks and persisted state;
if (Checks meet agreed criteria?) then (yes)
:Record acceptance and residual limitations;
else (no)
:Contain failure and assess correction or recovery;
:Reverify resulting candidate and state;
endif
stop
@enduml
```
