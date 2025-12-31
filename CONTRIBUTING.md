# Contributing to Weatherman

Thank you for your interest in contributing to Weatherman! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Branching Strategy](#branching-strategy)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/weatherman.git
   cd weatherman
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-org/weatherman.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Configure environment**:
   ```bash
   cp .env.example .env
   # Add your OpenWeatherMap API key to .env
   ```

## Development Workflow

### Before Starting Work

1. Create a new branch from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the [Code Standards](#code-standards)

3. Test your changes:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

### GPG Signing Requirements

All commits must be signed with GPG. This ensures commit authenticity and maintains security.

#### Setting Up GPG

1. **Generate a GPG key** (if you don't have one):
   ```bash
   gpg --full-generate-key
   # Choose RSA and RSA, 4096 bits
   # Add your GitHub email address
   ```

2. **List your keys**:
   ```bash
   gpg --list-secret-keys --keyid-format LONG
   ```

3. **Configure Git to use your key**:
   ```bash
   git config --global user.signingkey YOUR_KEY_ID
   git config --global commit.gpgsign true
   ```

4. **Add GPG key to GitHub**:
   ```bash
   gpg --armor --export YOUR_KEY_ID
   # Copy the output and add to GitHub Settings → SSH and GPG keys
   ```

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) with the following types:

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic changes)
- **refactor**: Code refactoring (no feature changes)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build config)
- **perf**: Performance improvements

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```bash
feat(voice): add wake word detection for "good morning weatherbot"

- Implement continuous speech recognition
- Add wake phrase detection logic
- Update voice service tests

Closes #123
```

```bash
fix(weather): handle timeout errors with stale cache fallback

When the weather API times out after 5 seconds, fall back to stale
cached data if available instead of showing error.

Fixes #456
```

```bash
docs(readme): update installation instructions

- Add Node.js 22+ requirement
- Include HTTPS setup for voice features
- Fix broken links
```

### Commit Message Rules

1. **Subject line**: Max 72 characters, lowercase, no period
2. **Body**: Wrap at 72 characters, explain what and why (not how)
3. **Footer**: Reference issues/PRs (`Closes #123`, `Fixes #456`)
4. **Sign commits**: All commits must be GPG signed

## Branching Strategy

### Branch Naming Convention

- **Feature branches**: `feature/short-description` or `spec/001/task/###-description`
- **Bug fixes**: `fix/short-description`
- **Documentation**: `docs/short-description`
- **Refactoring**: `refactor/short-description`

### Examples

```bash
feature/extreme-weather-handling
spec/001/task/055-service-worker
fix/voice-permission-error
docs/troubleshooting-guide
refactor/recommendation-service
```

### Main Branches

- **`main`**: Production-ready code, always stable
- Feature branches are created from and merged back into `main`

## Pull Request Process

### Creating a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR** on GitHub with:
   - **Title**: Following commit convention (`feat: add wake word detection`)
   - **Description**: What changes were made and why
   - **References**: Link to related issues
   - **Testing**: How you tested the changes
   - **Screenshots**: For UI changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Related Issues
Closes #123

## Testing
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Commits are GPG signed
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Review Process

1. **Automated checks**: Must pass linting, tests, and build
2. **Code review**: At least one approval required
3. **GPG signature**: All commits must be signed
4. **Squash and merge**: PRs will be squashed into main

## Code Standards

### JavaScript/React

- **ES2022+** syntax
- **Functional components** with hooks
- **JSX** for all React components
- **Named exports** for components and utilities
- **JSDoc comments** for functions and classes

### Style Guidelines

```javascript
// Good: Named export, JSDoc, clear function name
/**
 * Generate clothing recommendation based on weather
 * @param {Object} weatherData - Current weather data
 * @param {Object} profile - User profile
 * @returns {ClothingRecommendation}
 */
export function generateRecommendation(weatherData, profile) {
  // Implementation
}

// Good: Component with clear props
export function ProfileCard({ profile, isSelected, onSelect }) {
  return (
    <div onClick={() => onSelect(profile.id)}>
      {profile.displayName}
    </div>
  );
}
```

### File Organization

- **One component per file**
- **Co-locate styles** with components (inline or CSS modules)
- **Index files** for re-exports only
- **Test files** alongside source files (`*.test.js`)

### Naming Conventions

- **Components**: PascalCase (`ProfileCard.jsx`)
- **Hooks**: camelCase with `use` prefix (`useVoiceRecognition.js`)
- **Utilities**: camelCase (`voiceUtils.js`)
- **Constants**: UPPER_SNAKE_CASE (`WAKE_PHRASE`)

## Testing Requirements

### Test Coverage

- **Minimum 80%** for branches, functions, lines, and statements
- All new features must include tests
- Bug fixes should include regression tests

### Test Types

1. **Unit tests**: For utilities and services
2. **Integration tests**: For hooks and components
3. **E2E tests**: For critical user flows (future)

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test:coverage

# Specific file
npm test src/services/voiceService.test.js
```

### Writing Tests

```javascript
import { describe, it, expect } from 'vitest';
import { parseVoiceQuery } from './voiceUtils';

describe('parseVoiceQuery', () => {
  it('should extract clothing advice intent', () => {
    const result = parseVoiceQuery('What should I wear today?', 0.9);

    expect(result.intent).toBe('clothing_advice');
    expect(result.confidence).toBe(0.9);
  });

  it('should handle low confidence queries', () => {
    const result = parseVoiceQuery('mumble mumble', 0.3);

    expect(result.confidence).toBeLessThan(0.5);
  });
});
```

## Questions?

If you have questions or need help:

1. Check existing [documentation](./docs/)
2. Search [existing issues](https://github.com/your-org/weatherman/issues)
3. Open a new issue with the `question` label

Thank you for contributing to Weatherman! 🌤️
