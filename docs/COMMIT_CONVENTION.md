# Commit Convention Guide

This project uses **Conventional Commits** specification enforced by Husky and Commitlint.

## Quick Reference

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Description                                        | Example                                    |
|------------|----------------------------------------------------|--------------------------------------------|
| `feat`     | New feature or functionality                       | `feat(auth): add password reset flow`      |
| `fix`      | Bug fix                                            | `fix(api): resolve 404 on user routes`     |
| `docs`     | Documentation changes only                         | `docs(readme): update installation guide`  |
| `style`    | Code style (formatting, semicolons, whitespace)    | `style(auth): fix indentation`             |
| `refactor` | Code change that neither fixes a bug nor adds feature | `refactor(logger): migrate to Winston`  |
| `perf`     | Performance improvement                            | `perf(db): optimize user query`            |
| `test`     | Adding or updating tests                           | `test(auth): add login unit tests`         |
| `build`    | Build system or dependencies                       | `build(deps): upgrade prisma to 5.7.0`     |
| `ci`       | CI/CD configuration changes                        | `ci(github): add deploy workflow`          |
| `chore`    | Other changes (tooling, config, etc.)              | `chore(git): update .gitignore`            |
| `revert`   | Revert a previous commit                           | `revert: revert feat(auth): add oauth`     |

## Scope (Optional)

The scope provides additional context about what part of the codebase is affected.

Common scopes in this project:
- `auth` - Authentication related
- `api` - API endpoints
- `db` - Database/Prisma
- `logger` - Logging system
- `middleware` - Express middleware
- `socket` - WebSocket/Socket.IO
- `config` - Configuration
- `deps` - Dependencies
- `docker` - Docker related
- `ci` - CI/CD related

## Subject Rules

1. **Use imperative mood** ("add feature" not "added feature")
2. **Don't capitalize** the first letter
3. **No period** at the end
4. **Max 100 characters** for the entire header

## Examples

### ✅ Good Commits

```bash
# Feature
git commit -m "feat(auth): add Google OAuth login"
git commit -m "feat(api): implement user search endpoint"

# Bug Fix
git commit -m "fix(socket): resolve connection timeout issue"
git commit -m "fix(auth): handle expired token correctly"

# Refactor
git commit -m "refactor(logger): migrate from console to Winston"
git commit -m "refactor(prisma): extract to dedicated module"

# Documentation
git commit -m "docs(api): add Swagger annotations for rooms"
git commit -m "docs(readme): update environment variables section"

# Build/Dependencies
git commit -m "build(deps): upgrade express to 4.19.0"
git commit -m "build(docker): optimize Dockerfile layers"

# Multiple scopes (use comma)
git commit -m "fix(auth,middleware): resolve token validation"
```

### ❌ Bad Commits

```bash
# Missing type
git commit -m "add login feature"           # ❌ Missing type

# Wrong type case
git commit -m "FEAT(auth): add login"       # ❌ Type must be lowercase

# Period at end
git commit -m "fix(api): resolve bug."      # ❌ No period allowed

# Too vague
git commit -m "fix: fixed stuff"            # ❌ Too vague

# Past tense
git commit -m "feat(auth): added login"     # ❌ Use imperative mood

# Capitalized subject
git commit -m "feat(auth): Add login"       # ❌ Don't capitalize
```

## Body (Optional)

For complex changes, add a body after a blank line:

```bash
git commit -m "refactor(logger): migrate to Winston

- Add structured JSON logging for production
- Implement request context with AsyncLocalStorage
- Add automatic request ID propagation
- Configure file rotation for log files

This improves observability and enables integration
with log aggregation tools like ELK or Datadog."
```

## Breaking Changes

For breaking changes, add `!` after the type/scope or add `BREAKING CHANGE:` in footer:

```bash
# Using exclamation mark
git commit -m "feat(api)!: change user endpoint response format"

# Using footer
git commit -m "feat(api): change user endpoint response format

BREAKING CHANGE: response now returns user object in 'data' field"
```

## Referencing Issues

Reference GitHub issues in the commit message:

```bash
git commit -m "fix(auth): resolve login timeout issue

Fixes #123"
```

## Git Hooks

This project uses Husky to enforce commit conventions:

| Hook         | Action                           |
|--------------|----------------------------------|
| `commit-msg` | Validates commit message format  |
| `pre-commit` | Runs TypeScript type checking    |

### Bypassing Hooks (Emergency Only)

If you absolutely need to skip hooks (not recommended):

```bash
git commit --no-verify -m "your message"
```

## Related Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
