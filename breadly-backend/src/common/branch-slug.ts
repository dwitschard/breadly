/**
 * Converts a git branch name to a URL-safe slug.
 *
 * Rules:
 *   - Lowercase
 *   - Replace /, _, ., + with -
 *   - Strip leading and trailing hyphens
 *   - Truncate to 40 characters
 *   - Strip trailing hyphens introduced by truncation
 *
 * Example: "feature/recipe-search" → "feature-recipe-search"
 */
export function slugifyBranch(branchName: string): string {
  return branchName
    .toLowerCase()
    .replace(/[/_.+]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}
