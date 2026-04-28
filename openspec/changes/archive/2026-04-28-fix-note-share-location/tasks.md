## 1. NodeMenu — Move share toggle to directory graph

- [x] 1.1 Change share button visibility condition from `graphType === "detail" && selectedNode?.isDetail` to `graphType === "directory" && selectedNode?.isDetail`
- [x] 1.2 Update JSDoc comments referencing "detail" to reflect directory graph usage

## 2. NoteGraph — Rewrite share toggle handler

- [x] 2.1 Rewrite `handleNodeToggleShare` to use `selectedNode.id` instead of `noteDetail.note_id` for the API call
- [x] 2.2 When share succeeds, update only `isShared` on the node from the response — `isDetail` is a prerequisite, not a side-effect

## 3. NoteDetail — Add owner bypass in auth gate

- [x] 3.1 Import and call `verifyToken` from `api.ts` in the `getNoteDetail` function
- [x] 3.2 Before redirecting to `/unauthorized`, check if a valid token exists in localStorage; if valid, allow access regardless of share state
- [x] 3.3 Remove the `isShared` injection into flatTree nodes (no longer needed since detail graph shouldn't show share UI)

## 4. NoteNode — Ensure share icon shows in directory graph

- [x] 4.1 Verify the share icon badge renders correctly for directory graph nodes (it already checks `isDetail && isShared`, which will now be set)

## 5. Cleanup

- [x] 5.1 Remove unused `useNavigate` import from NoteDetail if no longer needed (auth gate still uses it)
- [x] 5.2 Verify no regressions: directory graph edit mode, detail graph rendering, search modal
