## Context

The current note-sharing implementation places the share/unshare toggle inside the detail graph NodeMenu, gated on `graphType === "detail" && selectedNode.isDetail`. However:

1. Sharing is a property of a **note** (a top-level entity), not of nodes within a note's content graph
2. Users must navigate into a note to share it — an unnecessary extra step
3. The toggle handler relies on `noteDetail.note_id`, which is only available in detail mode
4. The auth gate in NoteDetail blocks all unauthenticated access to non-shared notes, but note owners (who have their token in localStorage) should always be able to access their own notes

## Goals / Non-Goals

**Goals:**

- Move the share/unshare action to the directory graph NodeMenu
- Make share toggle work with directory graph nodes (using `node.id` directly)
- Auto-set `isDetail = true` on a note when it is shared (since shared notes must be navigable detail pages)
- Allow authenticated users (valid localStorage token) to access any note regardless of share state
- Display the share icon badge on shared nodes in the directory graph
- Remove share button from the detail graph NodeMenu

**Non-Goals:**

- No backend API changes — `toggleNoteShare` endpoint already accepts `noteId` and works correctly
- No changes to the search functionality
- No changes to how the detail graph renders or operates
- No changes to the data model beyond NodeData `isShared` and `isDetail` fields

## Decisions

1. **Share toggle in directory graph on `isDetail` nodes** — The share button shows when `graphType === "directory" && selectedNode?.isDetail`. Only notes that already have a detail graph (are detail-type nodes) can be shared. This avoids auto-setting `isDetail` as a side-effect of sharing.

2. **`isDetail` is a prerequisite, not a side-effect** — The share button is only shown on nodes where `isDetail = true` already. When toggling share, only the `isShared` field changes. `isDetail` must be set separately via the "detail node" checkbox in the add/edit modals.

3. **Owner bypass via token verification** — In NoteDetail's `getNoteDetail`, before redirecting to `/unauthorized`, check if the current user has a valid token in localStorage by calling `verifyToken`. If validated, allow access regardless of share state. This uses the existing `verifyToken` API.

4. **Node.id as the note identifier** — In directory mode, `selectedNode.id` is the note ID. The `toggleNoteShare` API already accepts `noteId`, so we can call it directly without needing `noteDetail`.

5. **Share icon visible in directory graph** — The `Share2` badge in `NoteNode` already renders when `isDetail && isShared`. Both fields will now be set on directory graph nodes, so the icon appears correctly.

## Risks / Trade-offs

- **Share only on detail nodes**: Only nodes with `isDetail = true` show the share option. Users must first mark a node as a detail node (via the existing checkbox) before sharing it. This is a two-step flow but keeps the data model clean.
- **Token check in NoteDetail**: Adds one extra API call on page load for authenticated users. Risk: Low — `verifyToken` is already called by `AuthGuard` on every route navigation, so this is additive only for the note detail page where AuthGuard already ran.
- **No unshare confirmation**: Currently no confirmation dialog for unsharing. This is consistent with other toggle actions (mark/unmark) in the app. Can be added later if needed.
