# Local review fixes

These changes address the ten issues identified in the local source review.

- Private boards are visible to their creator, the workspace owner, and workspace managers. All of these users must still belong to the workspace. Other members can access workspace-visible boards.
- Board listings, nested task/comment endpoints, analytics, and task activity feeds enforce that visibility.
- Removing a member revokes their ability to edit or delete comments, including comments they authored.
- Login requests are limited to five per minute per account/IP pair and thirty per minute per IP. Authentication errors return JSON to the frontend.
- Workspace, project, board, column, task, and member controls respect the signed-in user's role. Role changes are reserved for workspace owners.
- Member operations show validation, permission, session, and connection errors.
- Task moves immediately update the cached source and destination lists. Failed moves restore the previous lists and refresh server state.
- Boards, columns, and tasks support keyboard dragging: focus the move/drag button, press Space, use arrow keys, then press Space to drop or Escape to cancel.
- Board and column deletion renumbers remaining positions.
- Board/column/task position allocation and movement use parent row locks. Task changes lock and recheck the current task and its source column; conflicting stale operations are rejected.

Seven backend regression tests cover private-board visibility, owner/manager/creator access, viewer exclusion, private task activities, removed comment authors, deletion ordering, and login rate limiting.

The backend tests run against in-memory SQLite. They do not establish MySQL behavior under simultaneous requests. Browser checks of keyboard dragging and optimistic rollback remain useful before a release.
