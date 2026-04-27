## ADDED Requirements

### Requirement: Search button triggers modal

The system SHALL display a search button positioned above the "select mode" button. Clicking the search button SHALL open a modal overlay containing a search input field and results area.

#### Scenario: User clicks search button

- **WHEN** the user clicks the search button (with magnifying glass icon)
- **THEN** a modal overlay appears with an input field and empty results list

#### Scenario: Modal can be closed

- **WHEN** the user clicks the X button, clicks outside the modal, or presses Escape
- **THEN** the modal closes and the underlying graph is visible again

### Requirement: Real-time search filtering

The system SHALL filter note labels in real-time as the user types in the search input. The search SHALL match note labels using case-insensitive substring matching.

#### Scenario: User types in search field

- **GIVEN** notes with labels "Meeting Notes", "Shopping List", and "Work Tasks" exist
- **WHEN** the user types "meet" in the search input
- **THEN** only "Meeting Notes" appears in the results list

#### Scenario: Empty search query

- **WHEN** the search input is empty
- **THEN** the results list is empty or shows a "start typing" message

#### Scenario: No matching results

- **WHEN** the search query does not match any note labels
- **THEN** the results list shows "No notes found" message

### Requirement: Search is note-level only

The system SHALL only search against the Note model (directory-level notes) via the `/api/notes/search` endpoint. NoteNode items within note details SHALL NOT be searchable.

#### Scenario: Searching does not include detail nodes

- **GIVEN** a note "Project A" exists with detail nodes "Task 1" and "Task 2" inside it
- **WHEN** the user searches for "Task 1"
- **THEN** no results are returned because "Task 1" is a NoteNode within a note detail, not a Note in the directory

### Requirement: Clicking result navigates to note detail

The system SHALL navigate to the selected note's detail page when a search result is clicked.

#### Scenario: User clicks a search result

- **GIVEN** a note with id 42 and label "Meeting Notes" appears in search results
- **WHEN** the user clicks on "Meeting Notes" in the results list
- **THEN** the modal closes and the browser navigates to `/noteDetails/42`

#### Scenario: Multiple results available

- **GIVEN** search results show "Meeting Notes" and "Meeting Agenda"
- **WHEN** the user clicks "Meeting Notes"
- **THEN** only that note's detail page is opened
