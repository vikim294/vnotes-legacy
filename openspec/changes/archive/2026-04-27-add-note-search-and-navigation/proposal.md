## Why

As the note collection grows, users need a way to quickly find specific notes without manually browsing the graph. A search functionality will significantly improve navigation efficiency and user experience.

## What Changes

- Add a search button with magnifying glass icon positioned above the "select mode" button
- Clicking search button opens a modal overlay with:
    - Input field for entering search query
    - List of matching note titles below the input
- Search matches against note labels (note-level, not individual nodes)
- Clicking a search result navigates to that note's detail page (`/noteDetails/:id`)
- Real-time filtering as user types (debounced)
- No keyboard shortcut - access only via clicking the search button
- Modal can be closed via X button, clicking outside, or pressing Escape

## Capabilities

### New Capabilities

- `note-search`: Search interface and filtering logic for finding notes by label
- `search-navigation`: Navigation from search results to note location in graph

### Modified Capabilities

- None (no existing spec modifications required)

## Impact

- UI: New search bar component in header/toolbar area
- Graph interactions: Center-on-node functionality for navigation
- Dependencies: No new external dependencies (uses existing React state)
- Performance: Search should be debounced for smooth UX
