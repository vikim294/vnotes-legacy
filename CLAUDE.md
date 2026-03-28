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
- Lucide React - Icon library

### Application Structure

The app uses `BrowserRouter` with three main routes defined in `App.tsx`:
- `/` - NoteList (directory view of all notes)
- `/noteDetails/:id` - NoteDetail (graph view of a specific note)
- `/unauthorized` - Unauthorized access page

All routes except `/unauthorized` are wrapped in `AuthGuard` for authentication.

### Core Components

- `NoteGraph.tsx` - Main graph visualization component using SVG. Handles panning, zooming, node rendering, and edit mode.
  - **Viewport state caching**: Caches position (x, y) and zoom in localStorage for directory page
  - **Reset view**: Resets zoom to 1 and centers on first root node, clears cached viewport
- `NoteNode.tsx` - Renders individual nodes in the graph with support for text and image content.
  - **Image resize**: In edit mode, drag blue handle on bottom-right to resize image (maintains aspect ratio)
  - **Resize handle**: Visual size stays constant regardless of zoom (compensates for inverted zoom)
- `NoteTree.tsx` - Renders tree connections (lines) between nodes.
- `NodeMenu.tsx` - Context menu for node operations with Lucide icons:
  - Pencil (edit), Plus (add child), Link (set parent), Unlink (disconnect)
  - Bookmark (mark/unmark), Trash2 (delete)
- `AuthGuard.tsx` - Authentication check wrapper with server-side token verification.
- `Toast.tsx` - Toast notification system.
- `Button.tsx` - Reusable button component with `disabled` prop and `whitespace-nowrap`.

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
  imageWidth?: number;    // custom image width (for resize)
  imageHeight?: number;   // custom image height (for resize)
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
- `viewportZoom`: Current zoom level (inverted: higher = zoomed out, lower = zoomed in)

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
- **Exit confirmation**: Shows modal if unsaved changes when exiting edit mode

### Viewport State Caching (Directory Only)

To preserve user's view position when navigating back from note details:
- **Storage key**: `vnote-directory-viewport` in localStorage
- **Cached on**: Pan/drag end (immediate), pinch/zoom and wheel (debounced 300ms)
- **Loaded on**: Directory page mount
- **Cleared on**: "Reset view" button click

### Utility Functions

Key helpers in `lib.tsx`:
- `flattenTree()` - Convert tree structure to flat array
- `findDescendantsByIdInFlatTree()` - Find all child nodes recursively
- `findAncestorsByIdInFlatTreeMap()` - Find all parent nodes recursively
- `handleTapEnter()` - Keyboard handler for Enter key submissions
- `debounce()` - Debounce function for performance optimization
- `getDistanceBetweenTwoPoints()` - Calculate Euclidean distance between two points

### Zoom Behavior

**Inverted zoom logic**: Unlike standard zoom where higher value = zoomed in, this app uses:
- Higher `viewportZoom` = zoomed out (see more of canvas)
- Lower `viewportZoom` = zoomed in (closer view)
- This affects coordinate calculations: multiply by zoom for screen→world conversion

### Image Handling

- Images can be resized in edit mode via bottom-right handle
- Aspect ratio maintained using Euclidean distance of drag delta
- Custom dimensions stored in `imageWidth`/`imageHeight` fields
- Visual handle size compensated for zoom level

### Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically deploys to the server on pushes to `master` branch. Build output goes to `/www/wwwroot/vnotes-c` on the remote server.
