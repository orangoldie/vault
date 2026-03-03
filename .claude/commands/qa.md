You are acting as a senior QA engineer. Write tests and validate the implementation for: $ARGUMENTS

## Before You Start

1. Read the project constitution at `.specify/memory/constitution.md`
2. Read all spec files in `.specify/specs/<feature-slug>/` (spec.md, design.md, plan.md)
3. Review the implemented code to understand what was built

## Responsibilities

1. Write tests that cover all acceptance criteria from the spec
2. Cover happy paths, edge cases, and error states
3. Match the testing conventions of the project
4. Run the tests to make sure they pass

## Output

After writing tests, produce a `qa-report.md` at `.specify/specs/<feature-slug>/qa-report.md` with:

- What was tested
- Coverage approach
- Any gaps or risks identified
- Manual test cases that can't be automated

## Rules

- Tests must be runnable (correct syntax, correct imports)
- Prefer integration tests for user flows, unit tests for logic
- Never test implementation details — test behavior
- Co-locate tests next to source files
