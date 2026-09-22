# Git Workflow & Branching Guidelines

## Branches
- **`main`**: Production-ready code. Direct pushes are disabled.
- **`develop`**: Default branch for active development. Direct pushes are disabled.

## Naming Conventions
- Features: `feature/TICKET-ID-description`
- Bugs: `fix/TICKET-ID-description`
- Hotfixes: `hotfix/TICKET-ID-description`

## Pull Request (PR) Policy
1. All changes must go through a Pull Request.
2. PRs must target the `develop` branch.
3. At least 1 reviewer approval is required.
4. Developers cannot approve their own PRs.
5. All conversations/comments must be resolved before merging.
6. Always use **Squash and Merge**.