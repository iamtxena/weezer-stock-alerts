# Contributing to Weezer Stock Alerts

Thank you for your interest in contributing to Weezer Stock Alerts! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**When reporting a bug, include:**
- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, Node.js version)
- Any relevant error messages or logs

### Suggesting Features

Feature requests are welcome! Please provide:
- A clear description of the feature
- The problem it solves or use case it addresses
- Any implementation ideas you have
- Examples of similar features in other applications (if applicable)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes** following the code style guidelines
4. **Test your changes**: Ensure the app builds and runs correctly
5. **Update documentation** if you've changed functionality
6. **Commit your changes** with clear, descriptive messages
7. **Push to your fork** and submit a pull request

#### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Write clear commit messages following conventional commits format
- Update tests if applicable
- Update documentation for any changed functionality
- Ensure the build passes: `pnpm build`
- Reference any related issues in your PR description

#### Commit Message Format

```
type(scope): brief description

Detailed explanation (optional)

Fixes #issue-number (if applicable)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(alerts): add support for percentage-based price movements

Added moving_up_pct and moving_down_pct condition types to track
percentage changes in stock prices over time.

Fixes #42
```

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- Accounts for: Clerk, Supabase, Resend

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/weezer-stock-alerts.git
cd weezer-stock-alerts

# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example .env.local

# Add your credentials to .env.local

# Run development server
pnpm dev
```

### Project Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/hooks/` - React hooks for data fetching and state
- `src/stores/` - Zustand stores for client state
- `src/lib/` - Utility functions and shared logic
- `supabase/migrations/` - Database migrations

## Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Place all imports at the top of files

## Testing

Before submitting a PR, verify:
- The app builds successfully: `pnpm build`
- The app runs without errors: `pnpm dev`
- Your changes work as expected
- No console errors or warnings

## Documentation

- Update README.md if you add features or change setup
- Update CLAUDE.md for technical architecture changes
- Add JSDoc comments for complex functions
- Update API documentation for endpoint changes

## Questions?

Feel free to:
- Open an issue for discussion
- Ask questions in pull request comments
- Check existing issues and discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Weezer Stock Alerts!
