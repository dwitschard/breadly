/**
 * Tests for the strip-api-prefix CloudFront Function.
 *
 * The function is loaded by eval()-ing the source so tests run in plain Node
 * without any CloudFront infrastructure. Each test builds a minimal CloudFront
 * viewer-request event and asserts the resulting request URI.
 *
 * Test cases cover:
 *   1. /preview/<slug>/api/* rewrites to /preview/<slug>/* (API path forwarding)
 *   2. /preview/<slug>/styles.css passes through unchanged (static assets)
 *   3. /preview/<slug>/some-route rewrites to /preview/<slug>/index.html (SPA routing)
 *   4. /api/* rewrites to /* (root API path stripping — existing behaviour)
 *   5. /* passes through unchanged (root SPA — existing behaviour)
 */

const fs = require('fs');
const path = require('path');

// Load the CloudFront Function source and expose `handler` in this scope.
const fnSource = fs.readFileSync(
  path.join(__dirname, 'strip-api-prefix.js'),
  'utf8',
);
// eslint-disable-next-line no-new-func
const handler = new Function('event', fnSource + '\nreturn handler(event);');

function makeEvent(uri) {
  return { request: { uri } };
}

describe('strip-api-prefix CloudFront Function', () => {
  describe('Preview environment routing', () => {
    it('strips /api segment from preview API paths', () => {
      const event = makeEvent('/preview/feature-recipe-search/api/recipes');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-recipe-search/recipes');
    });

    it('strips /api segment and preserves trailing path', () => {
      const event = makeEvent('/preview/feature-foo/api/recipes/abc-123');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/recipes/abc-123');
    });

    it('strips /api and produces / when no sub-path follows', () => {
      const event = makeEvent('/preview/feature-foo/api');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/');
    });

    it('passes through static asset paths unchanged (CSS)', () => {
      const event = makeEvent('/preview/feature-foo/styles.abc123.css');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/styles.abc123.css');
    });

    it('passes through static asset paths unchanged (JS)', () => {
      const event = makeEvent('/preview/feature-foo/main.chunk.js');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/main.chunk.js');
    });

    it('passes through static asset paths in subdirectories unchanged', () => {
      const event = makeEvent('/preview/feature-foo/assets/logo.png');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/assets/logo.png');
    });

    it('rewrites non-asset paths to /preview/<slug>/index.html for SPA routing', () => {
      const event = makeEvent('/preview/feature-foo/recipes');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/index.html');
    });

    it('rewrites nested non-asset paths to index.html', () => {
      const event = makeEvent('/preview/feature-foo/recipes/detail/abc');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/index.html');
    });

    it('rewrites bare preview root to index.html', () => {
      const event = makeEvent('/preview/feature-foo');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-foo/index.html');
    });

    it('handles preview slug with hyphens', () => {
      const event = makeEvent('/preview/feature-recipe-search/api/recipes');
      const result = handler(event);
      expect(result.uri).toBe('/preview/feature-recipe-search/recipes');
    });
  });

  describe('Root environment routing (existing behaviour unchanged)', () => {
    it('strips /api prefix from root API paths', () => {
      const event = makeEvent('/api/recipes');
      const result = handler(event);
      expect(result.uri).toBe('/recipes');
    });

    it('strips /api and returns / when path is exactly /api', () => {
      const event = makeEvent('/api');
      const result = handler(event);
      expect(result.uri).toBe('/');
    });

    it('passes through root SPA paths unchanged', () => {
      const event = makeEvent('/');
      const result = handler(event);
      expect(result.uri).toBe('/');
    });

    it('passes through root static assets unchanged', () => {
      const event = makeEvent('/favicon.ico');
      const result = handler(event);
      expect(result.uri).toBe('/favicon.ico');
    });

    it('passes through /index.html unchanged', () => {
      const event = makeEvent('/index.html');
      const result = handler(event);
      expect(result.uri).toBe('/index.html');
    });
  });
});
