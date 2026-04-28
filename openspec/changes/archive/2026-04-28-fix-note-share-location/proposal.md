## Why

The note-sharing feature was partially implemented with the share toggle in the detail graph view, but sharing is a property of a note (a directory-level concept), not of nodes within a note's content graph. To share a note from the directory graph, users must first navigate into the note detail view — an unnecessary extra step. Additionally, shared notes need `isDetail = true` to be recognized as navigable detail pages.

## What Changes

- Move the share/unshare button from the detail graph NodeMenu to the directory graph NodeMenu
- Modify the share toggle handler to work with directory graph nodes (using `node.id` instead of `noteDetail.note_id`)
- Share button appears on directory graph nodes that have `isDetail = true` (nodes that already have a corresponding detail graph)
- When toggling share, only update `isShared` — `isDetail` is a prerequisite, not a side-effect
- The auth gate in NoteDetail page stays — shared notes are publicly accessible, and authenticated users (with valid token in localStorage) can access any note regardless of share state
- Remove the share button from the detail graph NodeMenu
- Keep the share icon display (`Share2` badge) on shared nodes in the directory graph

## Capabilities

### New Capabilities

- `note-sharing`: Share/unshare notes from the directory graph view. Shared notes are accessible via their note detail URL without authentication.

### Modified Capabilities

None — this is a new capability, not a modification of existing spec-level behavior.

## Impact

- **src/components/NodeMenu.tsx**: Change share button visibility from `graphType === "detail" && selectedNode?.isDetail` to `graphType === "directory" && selectedNode?.isDetail`
- **src/components/NoteGraph.tsx**: Rewrite `handleNodeToggleShare` to use `selectedNode.id` instead of `noteDetail.note_id`, only update `isShared` on the toggled node
- **src/pages/NoteDetail/index.tsx**: Update auth gate to allow authenticated users (valid token in localStorage) through regardless of share state; only block unauthenticated users for non-shared notes
- **src/components/NoteNode.tsx**: Keep the share icon badge, ensure it renders in directory graph as well
