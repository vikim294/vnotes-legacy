## Context

The SearchModal component in `src/components/SearchModal.tsx` currently closes when clicking anywhere on the modal mask (the dark background overlay). This happens because the outer wrapper div has `onClick={handleClose}` which triggers on any click within that area, including clicks intended to refocus or accidental clicks outside the modal content.

Current implementation:

- Line 86: `<div className="fixed inset-0..." onClick={handleClose}>`
- Line 90: Inner content uses `onClick={(e) => e.stopPropagation()}` to prevent close when clicking content

The modal should only close via explicit actions: clicking the X button or pressing Escape key.

## Goals / Non-Goals

**Goals:**

- Prevent accidental modal closure when clicking outside the search content
- Maintain existing intentional close mechanisms (X button, Escape key)
- Preserve all other modal functionality (search, result selection)

**Non-Goals:**

- No changes to modal styling or animation
- No changes to search functionality
- No new close mechanisms

## Decisions

**Decision: Remove onClick from mask div**

Remove the `onClick={handleClose}` handler from the modal mask div (line 86) entirely. This is the simplest and most direct solution.

Alternatives considered:

- Keep onClick but add more stopPropagation - more complex, doesn't solve the problem
- Add a flag to track intentional closes - unnecessary complexity for this use case

## Risks / Trade-offs

No significant risks. This is a straightforward UX improvement that aligns with common modal behavior patterns where masks don't close modals unless explicitly configured.
