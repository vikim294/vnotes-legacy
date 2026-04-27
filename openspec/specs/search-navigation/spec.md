## ADDED Requirements

### Requirement: Modal overlay blocks interaction with background

The system SHALL display a modal overlay that prevents interaction with the underlying graph while the search modal is open.

#### Scenario: Modal is open

- **WHEN** the search modal is displayed
- **THEN** clicking on the graph behind the modal does not interact with the graph
- **AND** the modal captures all keyboard events

### Requirement: Search input receives focus automatically

The system SHALL automatically focus the search input field when the modal opens.

#### Scenario: Modal opens

- **WHEN** the user clicks the search button and the modal appears
- **THEN** the search input field has focus and the cursor is blinking

### Requirement: Search input has debounced filtering

The system SHALL debounce the search filtering by 200ms to prevent excessive re-rendering while typing.

#### Scenario: User types quickly

- **WHEN** the user types "hello" rapidly character by character
- **THEN** the search filtering only executes 200ms after the last keystroke

### Requirement: Search results display note labels

The system SHALL display the matching note labels as a clickable list below the search input.

#### Scenario: Results are displayed

- **GIVEN** search query "proj" matches notes "Project Alpha" and "Project Beta"
- **WHEN** the results are displayed
- **THEN** the list shows "Project Alpha" and "Project Beta" as clickable items

### Requirement: Modal has close button

The system SHALL provide an X button in the top-right corner of the modal to close it.

#### Scenario: User clicks close button

- **WHEN** the user clicks the X button
- **THEN** the modal closes without navigation
