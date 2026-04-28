## Why

Currently, the note-search modal closes when users accidentally click on the modal mask (dark background). This is frustrating during search workflows where users may click outside the modal content unintentionally, losing their search query and results. The modal should only close via explicit user actions (clicking the X button or pressing Escape).

## What Changes

- Modify `SearchModal.tsx` to prevent modal close on mask click
- Keep existing close behaviors: X button click and Escape key press
- Remove `onClick={handleClose}` from the modal mask/overlay element

## Capabilities

### New Capabilities

<!-- None - this is a behavior modification, not a new capability -->

### Modified Capabilities

<!-- This modifies the modal interaction behavior. No spec-level requirement changes - just implementation detail. -->

## Impact

- Affects: `src/components/SearchModal.tsx`
- No API changes
- No dependency changes
- Improves UX for note search workflow
