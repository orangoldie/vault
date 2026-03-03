Set up or update the project constitution.

## Process

1. Check if `.specify/memory/constitution.md` already exists. If it does, ask if the user wants to overwrite it.
2. Scan the project directory to understand what already exists (files, frameworks, package.json, etc.) and pre-fill answers where possible.
3. Ask the user about:
   - What is this project? (product name + one sentence description)
   - Who are the target users?
   - Tech stack
   - UI framework or design system
   - Testing framework preference
   - Coding conventions or standards
   - Hard constraints
   - Anything else to always know about this project
4. Generate and write the constitution to `.specify/memory/constitution.md`.

## Rules

- Create `.specify/memory/` if it doesn't exist
- Be opinionated — fill in sensible defaults where the user says "TBD"
- Keep it concise but specific enough to guide development
