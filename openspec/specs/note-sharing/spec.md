## ADDED Requirements

### Requirement: Share note from directory graph

The system SHALL allow users to share/unshare a note directly from the directory graph view.

#### Scenario: Share a note from directory graph

- **WHEN** user right-clicks a note node with `isDetail = true` in the directory graph to open NodeMenu
- **THEN** the menu SHALL show a "share" option

#### Scenario: No share option on non-detail node in directory graph

- **WHEN** user right-clicks a note node without `isDetail` (or `isDetail = false`) in the directory graph
- **THEN** the menu SHALL NOT show a share/unshare option

#### Scenario: Click share on a note

- **WHEN** user clicks "share" on a note in the directory graph NodeMenu
- **THEN** the system SHALL call `toggleNoteShare(noteId)` with the note's ID
- **THEN** the system SHALL set `isShared = true` on the node
- **THEN** the node SHALL display a share icon badge

#### Scenario: Unshare a note from directory graph

- **WHEN** user clicks "unshare" on a shared note in the directory graph NodeMenu
- **THEN** the system SHALL call `toggleNoteShare(noteId)` with the note's ID
- **THEN** the system SHALL set `isShared = false` on the node

#### Scenario: Share button not shown in detail graph

- **WHEN** user right-clicks a node in the detail graph
- **THEN** the menu SHALL NOT show the share/unshare option

### Requirement: Authenticated access to any note

The system SHALL allow authenticated users (with valid token in localStorage) to access any note detail page regardless of share state.

#### Scenario: Owner accesses their own non-shared note

- **WHEN** an authenticated user (valid token in localStorage) navigates to `/noteDetails/:id` for a note with `isShared === false`
- **THEN** the system SHALL verify the token via `verifyToken`
- **THEN** if the token is valid, the system SHALL load and display the note normally
- **THEN** the system SHALL NOT redirect to `/unauthorized`

#### Scenario: Unauthenticated user accesses shared note

- **WHEN** an unauthenticated user (no valid token) navigates to `/noteDetails/:id` for a note with `isShared === true`
- **THEN** the system SHALL load and display the note normally

#### Scenario: Unauthenticated user accesses non-shared note

- **WHEN** an unauthenticated user (no valid token) navigates to `/noteDetails/:id` for a note with `isShared === false`
- **THEN** the system SHALL redirect to `/unauthorized`

### Requirement: Share icon on directory graph node

The system SHALL display a share icon badge on shared note nodes in the directory graph.

#### Scenario: Share icon visible on shared node in directory graph

- **WHEN** a note node in the directory graph has `isShared === true` and `isDetail === true`
- **THEN** the node SHALL display a `Share2` icon badge at the top-center of the node

#### Scenario: No share icon on non-shared node

- **WHEN** a note node has `isShared` not set or `isShared === false`
- **THEN** the node SHALL NOT display the share icon badge
