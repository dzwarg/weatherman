# Weatherman - Development Workflow

This document outlines the required workflow for making changes to the Weatherman codebase. All contributors must follow these procedures to ensure code quality, consistency, and traceability.

## Overview

The development workflow consists of six key stages:
1. Synchronize with main branch
2. Create a feature branch
3. Link to specification and task
4. Implement changes
5. Run quality checks
6. Create signed, conventional commits

## Detailed Workflow

### 1. Synchronize with Main Branch

Before starting any new work, ensure your local repository is up to date with the remote `main` branch.

```bash
# Fetch latest changes from remote
git fetch origin

# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main
```

**Why this matters:**
- Prevents merge conflicts
- Ensures you're working with the latest codebase
- Reduces integration issues later

### 2. Create a Feature Branch

All work must be done on a feature branch following the strict naming convention:

**Branch Naming Convention:**
```
spec/<spec-number>/task/<task-number>-<short-description>
```

**Components:**
- `spec/<spec-number>`: Reference to the specification document or epic
- `task/<task-number>`: Reference to the specific task or issue
- `<short-description>`: Brief, kebab-case description of the work

**Examples:**
```bash
# Example 1: Weather API integration
git checkout -b spec/1/task/3-weather-api-integration

# Example 2: Voice command parser
git checkout -b spec/2/task/7-voice-command-parser

# Example 3: Outfit recommendation engine
git checkout -b spec/1/task/12-outfit-recommendation-engine

# Example 4: PWA manifest setup
git checkout -b spec/3/task/5-pwa-manifest-setup
```

**Branch Naming Rules:**
- Use lowercase only
- Use hyphens for word separation (kebab-case)
- Keep descriptions concise but meaningful (3-5 words max)
- Both spec and task numbers are required
- No special characters except hyphens

### 3. Link to Specification and Task

**Required:** Every feature branch must reference:
1. **Specification (Spec)**: A documented feature, epic, or requirement
2. **Task**: A specific, actionable work item

**Documentation Location:**
- Specifications: `./specs/<number>-<short-description>/spec.md`
- Tasks: Track in issue tracker or `./specs/<number>-<short-description>/tasks.md`

**Example Spec Structure:**
```markdown
# Spec 1: Weather Data Integration

## Overview
Integrate OpenWeatherMap API for real-time weather data.

## Tasks
- Task 3: Implement weather API service
- Task 4: Create caching layer
- Task 5: Add error handling
```

**Before Creating a Branch:**
1. Ensure the spec document exists
2. Ensure the task is defined and documented
3. Understand acceptance criteria
4. Clarify any ambiguities

### 4. Make Code Changes

Implement your changes following the project's technical guidelines:

**Guidelines:**
- Follow the architecture defined in `./docs/technical-details.md`
- Adhere to React best practices
- Use Racine design system components
- Write clean, self-documenting code
- Add comments for complex logic only
- Update documentation as needed

**File Organization:**
- Components: `./src/components/`
- Hooks: `./src/hooks/`
- Services: `./src/services/`
- Utils: `./src/utils/`
- Tests: Co-locate with source files (e.g., `Component.test.jsx`)

### 5. Run Quality Checks

Before committing, **all quality checks must pass**.

#### A. Unit Tests

Run the test suite to ensure your changes don't break existing functionality:

```bash
# Run all tests
yarn test

# Run tests in watch mode during development
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

**Requirements:**
- All tests must pass (0 failures)
- New features must include unit tests
- Maintain or improve code coverage
- Minimum coverage target: 80%

#### B. Linting

Run linting to ensure code style consistency:

```bash
# Run ESLint
yarn lint

# Auto-fix linting issues where possible
yarn lint:fix
```

**Linting Rules:**
- ESLint with React and accessibility plugins
- Prettier for code formatting
- No console.log statements in production code
- No unused variables or imports

**Example `.eslintrc.json`:**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "react/prop-types": "warn"
  }
}
```

#### C. Type Checking (if using TypeScript)

```bash
# Run TypeScript compiler check
yarn tsc --noEmit
```

#### D. Build Verification

Ensure the application builds successfully:

```bash
# Create production build
yarn build

# Verify build output in ./dist/
```

**Quality Check Checklist:**
- [ ] All unit tests pass
- [ ] No linting errors
- [ ] No TypeScript errors (if applicable)
- [ ] Application builds successfully
- [ ] No console warnings in browser
- [ ] Manual testing completed

### 6. Create Signed, Conventional Commits

All commits **must** meet two requirements:
1. **GPG Signed**: Verify commit authenticity
2. **Conventional Commit Format**: Standardized commit messages

#### A. GPG Signing Setup

**First-time setup:**

```bash
# Generate GPG key (if you don't have one)
gpg --full-generate-key
# Choose RSA and RSA, 4096 bits, no expiration

# List GPG keys
gpg --list-secret-keys --keyid-format=long

# Configure Git to use your GPG key
git config --global user.signingkey <YOUR_GPG_KEY_ID>

# Enable automatic commit signing
git config --global commit.gpgsign true
```

**For GitHub:**
```bash
# Export your public key
gpg --armor --export <YOUR_GPG_KEY_ID>

# Copy the output and add to GitHub:
# Settings → SSH and GPG keys → New GPG key
```

**Verify signing is working:**
```bash
# Create a test signed commit
git commit --allow-empty -m "test: verify GPG signing"

# Verify the commit is signed
git log --show-signature -1
```

#### B. Conventional Commit Format

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Commit Types:**

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(weather): add 5-day forecast display` |
| `fix` | Bug fix | `fix(voice): resolve microphone permission error` |
| `docs` | Documentation changes | `docs(readme): update installation instructions` |
| `style` | Code style changes (formatting, no logic change) | `style(button): adjust padding and margins` |
| `refactor` | Code refactoring (no feature/bug change) | `refactor(api): simplify weather data parsing` |
| `test` | Adding or updating tests | `test(outfit): add unit tests for recommendation engine` |
| `chore` | Maintenance tasks | `chore(deps): update vite to v5.1.0` |
| `perf` | Performance improvements | `perf(cache): optimize service worker caching` |
| `ci` | CI/CD changes | `ci(github): add automated test workflow` |
| `build` | Build system changes | `build(vite): configure PWA plugin` |
| `revert` | Revert a previous commit | `revert: revert "feat(voice): add wake word"` |

**Scope (optional but recommended):**
- Component name: `weather`, `voice`, `outfit`, `profile`
- Layer: `api`, `ui`, `service`, `cache`
- Feature area: `pwa`, `offline`, `accessibility`

**Subject Rules:**
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters

**Body (optional):**
- Explain the "what" and "why" (not "how")
- Wrap at 72 characters per line
- Separate from subject with blank line

**Footer (optional):**
- Reference issues: `Closes #123` or `Refs #456`
- Breaking changes: `BREAKING CHANGE: description`

**Commit Examples:**

```bash
# Simple feature addition
git commit -m "feat(weather): add UV index display"

# Bug fix with body
git commit -m "fix(voice): prevent duplicate speech recognition
>
> The speech recognition was initializing multiple times when
> the component re-rendered, causing overlapping voice input.
> Added cleanup in useEffect to prevent this issue."

# With issue reference
git commit -m "feat(outfit): add rain gear recommendations
>
> Implements outfit suggestions for rainy weather including
> raincoats, umbrellas, and waterproof footwear.
>
> Closes #42"

# Breaking change
git commit -m "refactor(api)!: change weather data structure
>
> BREAKING CHANGE: The weather API response format has changed.
> Update all consumers to use the new nested structure."

# Multiple file changes
git commit -m "chore(deps): update React and related packages
>
> - React 18.2.0 → 18.3.0
> - React DOM 18.2.0 → 18.3.0
> - Testing Library React 14.0.0 → 14.1.0"
```

#### C. Committing Changes

**Workflow:**

```bash
# 1. Review your changes
git status
git diff

# 2. Stage specific files (preferred over git add .)
git add src/components/WeatherDisplay.jsx
git add src/hooks/useWeatherData.js
git add src/services/weatherAPI.test.js

# 3. Create a signed, conventional commit
git commit -m "feat(weather): add 5-day forecast component"

# 4. Verify commit is signed
git log --show-signature -1
```

**Commit Best Practices:**
- Make small, focused commits (one logical change per commit)
- Commit early and often
- Don't commit commented-out code
- Don't commit console.log statements
- Don't commit merge conflicts
- Don't commit secrets or API keys

**What NOT to commit:**
```bash
# Add to .gitignore
.env
.env.local
*.log
dist/
node_modules/
.DS_Store
```

## Complete Workflow Example

Here's a full example of the workflow from start to finish:

```bash
# 1. Sync with main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b spec/1/task/8-add-wind-speed-indicator

# 3. Verify spec and task exist
cat docs/specs/spec-1.md  # Review specification
cat docs/tasks/task-8.md  # Review task details

# 4. Make code changes
# ... implement the wind speed indicator ...

# 5. Run quality checks
yarn test                # ✓ All tests pass
yarn lint                # ✓ No linting errors
yarn build               # ✓ Build succeeds

# 6. Create signed commit
git add src/components/WindSpeedIndicator.jsx
git add src/components/WindSpeedIndicator.test.jsx
git add src/components/WeatherDisplay.jsx
git commit -m "feat(weather): add wind speed indicator component

Displays current wind speed in mph with direction arrow.
Includes accessibility labels for screen readers.

Refs #8"

# 7. Verify commit
git log --show-signature -1  # ✓ Signature verified

# 8. Push to remote
git push origin spec/1/task/8-add-wind-speed-indicator

# 9. Create Pull Request (if applicable)
# Open PR on GitHub/GitLab with:
# - Title: "feat(weather): add wind speed indicator"
# - Description referencing spec/1 and task/8
# - Link to acceptance criteria
```

## Pull Request Guidelines

When your branch is ready for review:

**PR Title:**
- Must follow conventional commit format
- Example: `feat(weather): add wind speed indicator`

**PR Description Template:**
```markdown
## Description
Brief description of the changes.

## Specification
- Spec: #1 (Weather Data Integration)
- Task: #8 (Add Wind Speed Indicator)

## Changes
- Added WindSpeedIndicator component
- Updated WeatherDisplay to include wind data
- Added unit tests with 90% coverage

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Tested on mobile devices
- [ ] Accessibility verified

## Screenshots (if applicable)
[Add screenshots or GIFs]

## Checklist
- [ ] Code follows project guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Build succeeds
- [ ] Commits are GPG signed
- [ ] Commits follow conventional format
```

**PR Review Process:**
1. Automated checks run (tests, linting, build)
2. Code review by team member(s)
3. Address review feedback
4. Re-run quality checks
5. Approval and merge

## Troubleshooting

### GPG Signing Issues

**Error: "gpg failed to sign the data"**
```bash
# Check if GPG is working
echo "test" | gpg --clearsign

# Restart GPG agent
gpgconf --kill gpg-agent

# Verify Git GPG configuration
git config --global --get user.signingkey
```

**Error: "No secret key"**
```bash
# List your keys
gpg --list-secret-keys --keyid-format=long

# Set the correct key
git config --global user.signingkey <YOUR_KEY_ID>
```

### Branch Naming Issues

**Wrong format:**
```bash
# ✗ Incorrect
git branch feature/weather-api
git branch task-5-outfit-engine

# ✓ Correct
git branch spec/1/task/5-weather-api-integration
git branch spec/2/task/12-outfit-recommendation-engine
```

**Renaming a branch:**
```bash
# Rename current branch
git branch -m spec/1/task/5-correct-name

# Rename another branch
git branch -m old-name spec/1/task/5-new-name
```

### Commit Message Issues

**Fixing the last commit message:**
```bash
# Edit the last commit message (only if not pushed)
git commit --amend

# Force push if already pushed (use with caution)
git push origin <branch-name> --force-with-lease
```

**Squashing commits:**
```bash
# Interactive rebase to squash last 3 commits
git rebase -i HEAD~3

# Mark commits to squash, then save
# Update commit message to follow conventional format
```

## Summary Checklist

Before considering your work complete, verify:

- [ ] Main branch is synced
- [ ] Feature branch follows naming convention: `spec/X/task/Y-description`
- [ ] Spec and task documents exist and are referenced
- [ ] Code changes are complete and tested
- [ ] All unit tests pass (`yarn test`)
- [ ] No linting errors (`yarn lint`)
- [ ] Application builds successfully (`yarn build`)
- [ ] Commits are GPG signed (verify with `git log --show-signature`)
- [ ] Commits follow conventional format
- [ ] Branch pushed to remote
- [ ] Pull request created (if applicable)

## References

- **Conventional Commits**: https://www.conventionalcommits.org/
- **GPG Signing Guide**: https://docs.github.com/en/authentication/managing-commit-signature-verification
- **Product Details**: `./docs/product-details.md`
- **Technical Details**: `./docs/technical-details.md`
- **CLAUDE.md**: `./CLAUDE.md` (AI assistant instructions)

## Questions?

If you have questions about the workflow or need clarification:
1. Check existing documentation in `./docs/`
2. Review closed PRs for examples
3. Ask in team communication channels
4. Update this document with FAQs as they arise

---

**Last Updated**: 2025-12-16
**Version**: 1.0
