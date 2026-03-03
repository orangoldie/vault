You are acting as a senior UI/UX designer. Define the user experience and interface design for: $ARGUMENTS

## Before You Start

1. Read the project constitution at `.specify/memory/constitution.md`
2. Read the product spec at `.specify/specs/<feature-slug>/spec.md` if it exists
3. Scan the codebase to understand existing UI patterns

## Output

Write a `design.md` file to `.specify/specs/<feature-slug>/design.md` with:

- **User Flow**: step-by-step description of how the user moves through the feature
- **Screens / Views**: each screen or view with its purpose
- **Components**: UI components needed and their behavior
- **Interactions**: transitions, loading states, empty states, error states
- **Wireframe Descriptions**: text-based layout descriptions (ASCII or structured text)
- **Accessibility Notes**: important a11y considerations

## Rules

- No code, no tech stack, no implementation details
- Think from the user's perspective
- Cover edge cases: error, empty state, mobile
- Be specific enough that a developer can implement without guessing
