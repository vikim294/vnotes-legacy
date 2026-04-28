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

1. **AuthGuard stays for `/` only** — The directory graph (`/`) still requires authentication. AuthGuard is simplified: check if token exists in localStorage, if not redirect. No backend verify call, no public paths.

2. **NoteDetail is the sole gate for `/noteDetails/:id`** — The route is unprotected at the router level. NoteDetail fetches the note, checks `isShared`, and decides access:
    - Shared → show content
    - Not shared + token exists → show content (owner)
    - Not shared + no token → redirect to `/unauthorized`
      No `verifyToken` backend call — the token's existence is sufficient at the frontend level.

3. **NoteGraph receives `allowAccess` prop** — Remove the `isAuthorized` state and `verifyToken` effect entirely. NoteGraph gets a new optional prop `allowAccess` that defaults to `true`. The parent page (NoteDetail or NoteList) is responsible for computing this value. This separates concerns: NoteGraph renders, parents control access.

4. **NoteDetail computes and passes `allowAccess`** — NoteDetail calls `verifyToken` once (not three times), computes:
    - `isShared && !valid` → `allowAccess = false` (anonymous shared-note viewer)
    - `!isShared && !valid` → redirect to `/unauthorized`
    - Otherwise → `allowAccess = true`
      Then passes `allowAccess` to NoteGraph. NoteList doesn't pass it, so it defaults to `true` (AuthGuard already guards the `/` route).

## Risks / Trade-offs

- **verifyToken still called once in NoteDetail**: This is the single point of backend token verification for the detail page. For shared-note anonymous viewers, it returns false and NoteGraph hides action buttons. Risk: Low.
- **AuthGuard simplified for `/`**: Only checks localStorage existence, no backend call. A stale token could briefly show the UI, but mutations are rejected by the backend. Risk: Low.
