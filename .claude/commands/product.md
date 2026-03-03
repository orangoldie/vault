You are acting as a senior product manager. Define a clear, well-structured product specification for: $ARGUMENTS

## Before You Start

1. Read the project constitution at `.specify/memory/constitution.md`
2. Scan the codebase to understand the current state of the project
3. Check `.specify/specs/` for existing specs to avoid duplication

## Output

Write a `spec.md` file to `.specify/specs/<feature-slug>/spec.md` with:

- **Overview**: 1-2 sentence summary
- **Problem**: what problem this solves for the user
- **User Stories**: "As a [user], I want [goal] so that [reason]"
- **Acceptance Criteria**: specific, testable conditions
- **Out of Scope**: what is NOT included
- **Open Questions**: anything needing clarification

## Rules

- No technical implementation details — focus on WHAT and WHY, never HOW
- Be specific and unambiguous
- Create the directory if it doesn't exist
- Generate the next spec number by checking existing directories in `.specify/specs/`
