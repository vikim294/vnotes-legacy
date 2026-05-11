## MODIFIED Requirements

### Requirement: Authenticated access to any note

The system SHALL allow authenticated users (with a token in localStorage) to access any note detail page regardless of share state. The system SHALL NOT require backend token verification at the route level for note detail pages.

#### Scenario: Owner accesses their own non-shared note

- **WHEN** a user with a token in localStorage navigates to `/noteDetails/:id` for a note with `isShared === false`
- **THEN** the system SHALL verify the token via `verifyToken`
- **THEN** if valid, the system SHALL pass `allowOperate=true` to NoteGraph
- **THEN** the system SHALL load and display the note normally

#### Scenario: Unauthenticated user accesses non-shared note

- **WHEN** a user without a token in localStorage navigates to `/noteDetails/:id` for a note with `isShared === false`
- **THEN** the system SHALL redirect to `/unauthorized`

#### Scenario: Unauthenticated user accesses shared note

- **WHEN** a user without a token in localStorage navigates to `/noteDetails/:id` for a note with `isShared === true`
- **THEN** the system SHALL load and display the note normally
- **THEN** the system SHALL pass `allowOperate=false` to NoteGraph
- **THEN** NoteGraph SHALL hide action buttons (edit, search, etc.)

## REMOVED Requirements

### Requirement: Public path bypass

**Reason**: Replaced by per-note `isShared` access control.
**Migration**: Remove `PUBLIC_PATHS` from AuthGuard; NoteDetail handles access via `isShared`.
