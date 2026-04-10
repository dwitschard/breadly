import { describe, it, expect, vi } from 'vitest';
import { uniqueName } from './test-data.helper';

describe('test-data.helper', () => {
  describe('uniqueName', () => {
    it('generates a name with the E2E prefix and test name', () => {
      const name = uniqueName('manage-recipe', 'Banana Bread');
      expect(name).toMatch(/^\[E2E-manage-recipe\] Banana Bread-\d+-\d+$/);
    });

    it('generates unique names on consecutive calls', () => {
      const name1 = uniqueName('test', 'item');
      const name2 = uniqueName('test', 'item');
      expect(name1).not.toBe(name2);
    });

    it('includes the test name in the prefix', () => {
      const name = uniqueName('view-profile', 'Test User');
      expect(name.startsWith('[E2E-view-profile]')).toBe(true);
    });
  });
});
