import { slugifyBranch } from './branch-slug.js';

describe('slugifyBranch', () => {
  it('converts feature/recipe-search to feature-recipe-search', () => {
    expect(slugifyBranch('feature/recipe-search')).toBe('feature-recipe-search');
  });

  it('lowercases uppercase characters', () => {
    expect(slugifyBranch('Feature/Recipe-Search')).toBe('feature-recipe-search');
  });

  it('replaces underscores with hyphens', () => {
    expect(slugifyBranch('feature_recipe_search')).toBe('feature-recipe-search');
  });

  it('replaces dots with hyphens', () => {
    expect(slugifyBranch('v1.2.3-release')).toBe('v1-2-3-release');
  });

  it('replaces + with hyphens', () => {
    expect(slugifyBranch('feature+experiment')).toBe('feature-experiment');
  });

  it('strips leading hyphens', () => {
    expect(slugifyBranch('/leading-slash')).toBe('leading-slash');
  });

  it('strips trailing hyphens', () => {
    expect(slugifyBranch('trailing-slash/')).toBe('trailing-slash');
  });

  it('truncates to 40 characters', () => {
    const long = 'a'.repeat(50);
    expect(slugifyBranch(long)).toHaveLength(40);
  });

  it('truncates exactly at 40 characters', () => {
    const exact = 'x'.repeat(40);
    expect(slugifyBranch(exact)).toBe(exact);
  });

  it('handles names already in slug form', () => {
    expect(slugifyBranch('my-feature-branch')).toBe('my-feature-branch');
  });

  it('handles main branch name', () => {
    expect(slugifyBranch('main')).toBe('main');
  });

  it('strips trailing hyphens introduced by truncation', () => {
    // 39 'a' chars + '-extra' → after replace and truncation at 40 chars, ends with 'a' not '-'
    const result = slugifyBranch('a'.repeat(39) + '-extra');
    expect(result).toMatch(/[a-z0-9]$/);
    expect(result).not.toMatch(/-$/);
  });

  it('handles numeric branch names', () => {
    expect(slugifyBranch('fix/123-bug')).toBe('fix-123-bug');
  });
});
