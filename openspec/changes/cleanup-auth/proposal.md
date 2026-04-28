## Why

The note-sharing feature now handles access control via the `isShared` field per note. The old auth code — hard-coded public paths, duplicate backend token verification, and AuthGuard blocking all note detail routes — is redundant and actually breaks the sharing feature (anonymous users can't reach shared notes because AuthGuard blocks them first).

## What Changes

- Remove hard-coded `PUBLIC_PATHS` from AuthGuard (IDs 49 and 22 are no longer special)
- Remove AuthGuard from the `/noteDetails/:id` route — NoteDetail handles its own access control
- Remove the duplicate `isAuthorized` state and `verifyToken` effect from NoteGraph; NoteGraph receives an `allowAccess` prop instead
- NoteDetail computes `allowAccess` by checking `isShared` and token validity, passes it to NoteGraph to gate action buttons
- Clean up unused imports

## Capabilities

### New Capabilities

None — this is cleanup and removal of dead code.

### Modified Capabilities

- `note-sharing`: Updated auth flow — NoteDetail is the sole gate for note access, AuthGuard no longer blocks shared notes

## Impact

- **src/components/AuthGuard.tsx**: Remove `PUBLIC_PATHS`, simplify the guard to only check token existence
- **src/App.tsx**: Remove AuthGuard wrapper from `/noteDetails/:id` route
- **src/components/NoteGraph.tsx**: Remove `isAuthorized` state and effect, accept `allowAccess` prop (defaults `true`) to gate action buttons
- **src/pages/NoteDetail/index.tsx**: Keep `verifyToken` call to compute `allowAccess`; pass `allowAccess` to NoteGraph; redirect only when `!isShared && !valid`
