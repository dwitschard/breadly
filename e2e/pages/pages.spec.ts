import { describe, it, expect, vi } from 'vitest';

describe('Page Objects API surface', () => {
  describe('NavbarPage', () => {
    it('exposes expected navigation methods', async () => {
      const { NavbarPage } = await import('./shared/navbar.page');
      const methods = [
        'navigateToRecipes',
        'navigateToHealth',
        'navigateToProfile',
        'navigateToHome',
        'openProfileMenu',
        'logout',
        'expectLoggedIn',
        'expectLoggedOut',
        'expectRecipesLinkVisible',
        'expectHealthLinkVisible',
      ];
      for (const method of methods) {
        expect(typeof NavbarPage.prototype[method]).toBe('function');
      }
    });
  });

  describe('RecipeListPage', () => {
    it('exposes expected methods', async () => {
      const { RecipeListPage } = await import('./recipes/recipe-list.page');
      const methods = [
        'goto',
        'createRecipe',
        'deleteRecipe',
        'getRecipeItem',
        'expectRecipeVisible',
        'expectRecipeNotVisible',
        'expectEmptyState',
        'expectLoaded',
      ];
      for (const method of methods) {
        expect(typeof RecipeListPage.prototype[method]).toBe('function');
      }
    });
  });

  describe('ProfilePage', () => {
    it('exposes expected methods', async () => {
      const { ProfilePage } = await import('./profile/profile.page');
      const methods = [
        'goto',
        'expectEmail',
        'expectUserId',
        'expectRoleVisible',
        'expectLoaded',
      ];
      for (const method of methods) {
        expect(typeof ProfilePage.prototype[method]).toBe('function');
      }
    });
  });

  describe('LoginPage', () => {
    it('exposes expected methods', async () => {
      const { LoginPage } = await import('./auth/login.page');
      const methods = [
        'goto',
        'expectRedirectedToLogin',
        'fillCognitoCredentials',
        'expectLoggedIn',
      ];
      for (const method of methods) {
        expect(typeof LoginPage.prototype[method]).toBe('function');
      }
    });
  });

  describe('RecipeFormPage', () => {
    it('exposes expected methods', async () => {
      const { RecipeFormPage } = await import('./recipes/recipe-form.page');
      const methods = [
        'fillName',
        'submit',
        'createRecipe',
        'expectSubmitDisabled',
        'expectSubmitEnabled',
      ];
      for (const method of methods) {
        expect(typeof RecipeFormPage.prototype[method]).toBe('function');
      }
    });
  });
});
