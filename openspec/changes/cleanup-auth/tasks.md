## 1. Remove AuthGuard from note detail route

- [x] 1.1 In `App.tsx`, remove the `AuthGuard` wrapper from the `/noteDetails/:id` route
- [x] 1.2 In `AuthGuard.tsx`, remove `PUBLIC_PATHS`, remove `useLocation`, keep `verifyToken` call to validate the stored token
- [x] 1.3 Clean up unused imports in both files

## 2. Add `allowOperate` prop to NoteGraph

- [x] 2.1 Add `allowOperate?: boolean` to `NoteGraphProps` interface, defaulting to `true`
- [x] 2.2 Remove `isAuthorized` state, `useEffect` with `verifyToken`, and `useState` import for it
- [x] 2.3 Replace `isAuthorized` usage in JSX with `props.allowOperate ?? true`

## 3. Compute `allowOperate` in NoteDetail

- [x] 3.1 In `getNoteDetail`, add `const [allowOperate, setAllowOperate] = useState(true)`
- [x] 3.2 After fetching note, compute: if `isShared===false && !validToken` → redirect, else set `allowOperate` based on token validity
- [x] 3.3 Pass `allowOperate` to NoteGraph
- [x] 3.4 Remove unused imports

## 4. Verify

- [x] 4.1 Build passes with no errors
