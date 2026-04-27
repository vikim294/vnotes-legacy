## 1. API Integration

- [x] 1.1 Add `searchNotes` function to `api.ts` calling `/api/notes/search?keyword={query}`

## 2. Search Modal Component

- [x] 2.1 Create `SearchModal.tsx` component with input field and results list
- [x] 2.2 Implement modal open/close state management
- [x] 2.3 Add click-outside and Escape key handlers to close modal
- [x] 2.4 Implement debounced search (200ms) using existing `debounce` utility

## 3. Search Button UI

- [x] 3.1 Add search button with magnifying glass icon above "select mode" button
- [x] 3.2 Wire up search button click to open modal

## 4. Search Results & Navigation

- [x] 4.1 Display search results as clickable list items with note labels
- [x] 4.2 Implement click handler to navigate to `/noteDetails/:id`
- [x] 4.3 Show "No notes found" message when search returns no results
- [x] 4.4 Show empty state or placeholder when input is empty

## 5. Polish & Integration

- [x] 5.1 Style modal and results list to match app theme (Tailwind CSS)
- [x] 5.2 Ensure modal auto-focuses input field when opened
- [x] 5.3 Test search flow end-to-end
