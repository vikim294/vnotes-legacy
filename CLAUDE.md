# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` - Start the Vite development server
- `pnpm build` - Build the application for production (runs `tsc -b && vite build`)
- `pnpm lint` - Run ESLint on all files
- `pnpm preview` - Preview the production build locally

## Architecture Overview

This is a React-based note-taking application with an interactive graph visualization interface. Notes are displayed as nodes in an SVG-based graph with parent-child relationships.

### Key Technologies

- React 19 with React Compiler enabled (via babel-plugin-react-compiler)
- React Router v7
- TypeScript 5.9 with strict mode
- Vite 7 for build tooling
- Tailwind CSS 4 with custom theme variables
- pnpm for package management

### Application Structure

The app uses `BrowserRouter` with three main routes defined in `App.tsx`:
- `/` - NoteList (directory view of all notes)
- `/noteDetails/:id` - NoteDetail (graph view of a specific note)
- `/unauthorized` - Unauthorized access page

All routes except `/unauthorized` are wrapped in `AuthGuard` for authentication.

### Core Components

- `NoteGraph.tsx` - Main graph visualization component using SVG. Handles panning, zooming, node rendering, and edit mode.
- `NoteNode.tsx` - Renders individual nodes in the graph with support for text and image content.
- `NoteTree.tsx` - Renders tree connections (lines) between nodes.
- `NodeMenu.tsx` - Context menu for node operations (add sibling, add child, edit, delete, set parent, disconnect, toggle mark).
- `AuthGuard.tsx` - Authentication check wrapper with server-side token verification.
- `Toast.tsx` - Toast notification system.
- `Button.tsx` - Reusable button component with `disabled` prop support.

### Data Model

The core data type is `NodeData` (defined in `src/types.ts`):

```typescript
interface NodeData {
  id: number | string;
  pid?: number | string | null;  // parent id
  label: string;
  x: number;  // coordinate in graph
  y: number;  // coordinate in graph
  children?: NodeData[];  // for tree structure
  expanded?: boolean;
  nodeType?: "new" | "edited" | "deleted";
  contentType?: "text" | "image";
  imageUrl?: string;
  isTempImageUrl?: boolean;
  marked?: boolean;
  isDetail?: boolean;
}
```

The application uses a flat tree structure (`flatTree`) for rendering but maintains parent-child relationships via `pid` (parent id) references.

### State Management

`PaperContext` provides shared state for graph interactions:
- `graphType`: "directory" | "detail" - Whether viewing note list or specific note detail
- `browseMode`: boolean - Enable pan/zoom vs node selection
- `editMode`: boolean - Enable node editing operations
- `selectedNodeId`: Currently selected node
- `isChoosingParent`: State for parent selection mode
- `flatTree`: Array of all nodes
- `isSaving`: Loading state during save operations (hides other buttons, disables save)

### Authentication

Server-side token verification via `/api/auth/verify` endpoint:
- Token stored in localStorage under key "vnote"
- Public paths bypass auth: `/noteDetails/49`, `/noteDetails/22`
- AuthGuard validates tokens asynchronously on mount

### API and Environment

API endpoints are configured via environment variables:
- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_IMAGE_BASE_URL` - Image server base URL

Development defaults to `http://localhost:2940`, production uses `https://vnote.cloud`.

Key API functions in `api.ts`:
- `verifyToken(token)` - POST to `/auth/verify` to validate authentication

### Graph Modes

The app supports two graph types:
1. **Directory** (`graphType="directory"`) - Shows all notes as nodes
2. **Detail** (`graphType="detail"`) - Shows nodes for a specific note's detail view

Each graph supports:
- **Browse mode**: Pan and zoom the canvas
- **Edit mode**: Add, edit, delete, and move nodes; set parent relationships
- **Reset view**: Resets zoom to 1 and centers on first root node (`pid === null`)

### Utility Functions

Key helpers in `lib.tsx`:
- `flattenTree()` - Convert tree structure to flat array
- `findDescendantsByIdInFlatTree()` - Find all child nodes recursively
- `findAncestorsByIdInFlatTreeMap()` - Find all parent nodes recursively
- `handleTapEnter()` - Keyboard handler for Enter key submissions

### Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically deploys to the server on pushes to `master` branch. Build output goes to `/www/wwwroot/vnotes-c` on the remote server.
