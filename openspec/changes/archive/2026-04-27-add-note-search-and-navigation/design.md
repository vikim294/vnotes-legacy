## Context

This is a React-based note-taking application with graph visualization. The app has two levels:

1. **Directory level (`/`)** - Shows all **Notes** as nodes in a graph. Each Note has an id, label, x/y coordinates, and optional parent (pid).
2. **Detail level (`/noteDetails/:id`)** - Shows **NoteNodes** within a specific Note. NoteNodes are the content items (text/image nodes) inside a Note.

Backend API distinction:

- **`/api/notes/search`** - Searches the `Note` model (directory-level items)
- **`/api/noteDetails/:id`** - Returns a Note with its associated `NoteNode` items (detail-level content)

Current UI has a "select mode" button (browse/edit toggle). The search button will be positioned above this button in the toolbar.

## Goals / Non-Goals

**Goals:**

- Provide a search button UI that opens a modal for searching notes
- Filter notes in real-time as user types (debounced 200ms)
- Navigate to selected note's detail page when clicked
- Support closing modal via X button, outside click, or Escape key
- Match search against note labels only (not content)

**Non-Goals:**

- No keyboard shortcut to trigger search (user requirement)
- No NoteNode-level search (items inside a Note's detail graph are not searchable)
- No fuzzy search or advanced filters (simple substring matching)
- No search history or recent searches

## Decisions

**Search Scope: Note-level vs Node-level**
"Note-level" means searching **Notes** (directory graph items) via `/api/notes/search`. This searches the `Note` table which contains all notes visible in the directory view.

"Node-level" would mean searching **NoteNodes** (detail graph items inside a Note). NoteNodes are NOT searchable - they live in the detail view (`/noteDetails/:id`) and belong to a specific Note.

Search matches against the `label` field of the Note model only.

**Modal vs Inline Search**
Modal overlay is chosen over inline search to:

- Keep the graph view unobstructed
- Provide a focused search experience
- Allow for a larger, more readable results list

**Navigation: Full page navigation vs In-graph centering**
Full page navigation to `/noteDetails/:id` is chosen because:

- User specifically requested navigating to note detail page
- Simpler implementation - uses existing React Router navigation
- Consistent with how notes are normally accessed

**Search Algorithm: Simple substring matching**

- Case-insensitive substring search
- No fuzzy matching or ranking needed for MVP
- Results ordered by label alphabetically

## Risks / Trade-offs

**Performance with large note collections**

- Risk: Filtering thousands of notes on every keystroke could cause lag
- Mitigation: Debounce input (200ms) and use simple string operations

**Modal accessibility**

- Risk: Modal may not trap focus properly
- Mitigation: Use standard modal patterns with focus management
