## Context

The auth architecture has grown redundant layers:

1. **AuthGuard** at the route level — blocks all routes except two hard-coded note IDs. This prevents anonymous users from reaching NoteDetail for shared notes.
2. **NoteGraph's `isAuthorized`** — runs `verifyToken` again on every mount, duplicating AuthGuard's work.
3. **NoteDetail's auth gate** — runs `verifyToken` a third time in the non-shared note path.

## Goals / Non-Goals

**Goals:**

- Remove the hard-coded note ID bypass list (49, 22)
- Let NoteDetail be the sole access controller for note detail pages
- Replace async `verifyToken` calls with synchronous localStorage existence checks where appropriate (frontend is not the security boundary — the backend API enforces auth)
- Reduce network calls on page load

**Non-Goals:**

- No changes to the backend API or authentication mechanism
- No changes to the Unauthorized page or login flow
- No changes to how the directory graph loads

## Decisions

1. **AuthGuard stays for `/` only** — The directory graph (`/`) still requires authentication. AuthGuard checks localStorage for a token, then verifies it with the backend via `verifyToken`. Invalid tokens are cleared and redirect to `/unauthorized`. No public paths.

2. **NoteDetail is the sole gate for `/noteDetails/:id`** — The route is unprotected at the router level. NoteDetail fetches the note, checks `isShared`, and decides access:
   - Shared → show content
   - Not shared + token exists → show content (owner)
   - Not shared + no token → redirect to `/unauthorized`
     No `verifyToken` backend call — the token's existence is sufficient at the frontend level.

3. **NoteGraph receives `allowOperate` prop** — Remove the `isAuthorized` state and `verifyToken` effect entirely. NoteGraph gets a new optional prop `allowOperate` that defaults to `true`. The parent page (NoteDetail or NoteList) is responsible for computing this value. This separates concerns: NoteGraph renders, parents control access.

4. **NoteDetail computes and passes `allowOperate`** — NoteDetail calls `verifyToken` once (not three times), computes:
   - `isShared && !valid` → `allowOperate = false` (anonymous shared-note viewer)
   - `!isShared && !valid` → redirect to `/unauthorized`
   - Otherwise → `allowOperate = true`
     Then passes `allowOperate` to NoteGraph. NoteList doesn't pass it, so it defaults to `true` (AuthGuard already guards the `/` route).

## Risks / Trade-offs

- **verifyToken still called once in NoteDetail**: This is the single point of backend token verification for the detail page. For shared-note anonymous viewers, it returns false and NoteGraph hides action buttons. Risk: Low.
- **AuthGuard still calls `verifyToken` for `/`**: Backend verification on directory page mount adds a network call but ensures token validity before showing the UI. A stale token is caught early. Risk: Low.
