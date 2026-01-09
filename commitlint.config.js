/**
 * Commitlint Configuration
 * 
 * Enforces Conventional Commits specification
 * https://www.conventionalcommits.org/
 * 
 * Format: <type>(<scope>): <subject>
 * 
 * Examples:
 *   feat(auth): add Google OAuth login
 *   fix(api): resolve 404 error on user routes
 *   docs(readme): update installation instructions
 *   refactor(logger): migrate to Winston
 */

module.exports = {
    extends: ['@commitlint/config-conventional'],

    rules: {
        // Type must be one of the allowed values
        'type-enum': [
            2,
            'always',
            [
                'feat',     // New feature
                'fix',      // Bug fix
                'docs',     // Documentation only
                'style',    // Code style (formatting, semicolons, etc.)
                'refactor', // Code refactoring (no feature change, no bug fix)
                'perf',     // Performance improvement
                'test',     // Adding or updating tests
                'build',    // Build system or dependencies
                'ci',       // CI/CD configuration
                'chore',    // Other changes (e.g., updating .gitignore)
                'revert',   // Revert a previous commit
                'wip',      // Work in progress (use sparingly)
            ],
        ],

        // Type must be lowercase
        'type-case': [2, 'always', 'lower-case'],

        // Type cannot be empty
        'type-empty': [2, 'never'],

        // Subject cannot be empty
        'subject-empty': [2, 'never'],

        // Subject must not end with period
        'subject-full-stop': [2, 'never', '.'],

        // Subject max length (header = type + scope + subject)
        'header-max-length': [2, 'always', 100],

        // Body max line length
        'body-max-line-length': [2, 'always', 200],

        // Scope is optional but must be lowercase if provided
        'scope-case': [2, 'always', 'lower-case'],
    },
};
