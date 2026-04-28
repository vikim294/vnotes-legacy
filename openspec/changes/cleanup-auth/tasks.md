## 1. Remove AuthGuard from note detail route

- [x] 1.1 In `App.tsx`, remove the `AuthGuard` wrapper from the `/noteDetails/:id` route
- [x] 1.2 In `AuthGuard.tsx`, remove `PUBLIC_PATHS`, remove `useLocation`, remove `verifyToken` call — simplify to just check localStorage token existence
- [x] 1.3 Clean up unused imports in both files

## 2. Add `allowAccess` prop to NoteGraph

- [x] 2.1 Add `allowAccess?: boolean` to `NoteGraphProps` interface, defaulting to `true`
- [x] 2.2 Remove `isAuthorized` state, `useEffect` with `verifyToken`, and `useState` import for it
- [x] 2.3 Replace `isAuthorized` usage in JSX with `props.allowAccess ?? true`

## 3. Compute `allowAccess` in NoteDetail

- [x] 3.1 In `getNoteDetail`, add `const [allowAccess, setAllowAccess] = useState(true)`
- [x] 3.2 After fetching note, compute: if `isShared===false && !validToken` → redirect, else set `allowAccess` based on token validity
- [x] 3.3 Pass `allowAccess` to NoteGraph
- [x] 3.4 Remove unused imports

## 4. Verify

- [x] 4.1 Build passes with no errors
