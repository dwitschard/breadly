/**
 * CloudFront Function — strip-api-prefix
 *
 * Handles routing for the Breadly SPA and preview environments.
 *
 * Preview paths (/preview/<slug>/...):
 *   /preview/<slug>/api/*          → strip /api, forward to API GW as /preview/<slug>/*
 *   /preview/<slug>/<file.ext>     → pass through to S3 (CSS, JS, images)
 *   /preview/<slug>/<non-asset>    → rewrite to /preview/<slug>/index.html (Angular SPA routing)
 *
 * Root paths:
 *   /api/*                         → strip /api prefix, forward to API Gateway
 *   /*                             → pass through to S3 (default CloudFront behaviour)
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Preview environment: /preview/<slug>/api/* → strip /api segment
  // e.g. /preview/feature-foo/api/recipes → /preview/feature-foo/recipes
  var previewApiMatch = uri.match(/^(\/preview\/[^/]+)\/api(\/.*)?$/);
  if (previewApiMatch) {
    request.uri = previewApiMatch[1] + (previewApiMatch[2] || '/');
    return request;
  }

  // Preview environment: pass static assets through unchanged
  // A path has an extension if the last segment contains a dot (e.g. styles.css, main.js)
  var previewAssetMatch = uri.match(/^\/preview\/[^/]+\/.*\.[^/]+$/);
  if (previewAssetMatch) {
    return request;
  }

  // Preview environment: rewrite non-asset paths to /preview/<slug>/index.html
  // so Angular's client-side router handles the URL after hydration.
  var previewSpaMatch = uri.match(/^(\/preview\/[^/]+)(\/.*)?$/);
  if (previewSpaMatch) {
    request.uri = previewSpaMatch[1] + '/index.html';
    return request;
  }

  // Root API path: /api/* → strip /api prefix
  // e.g. /api/recipe → /recipe
  if (uri.startsWith('/api')) {
    request.uri = uri.replace(/^\/api/, '') || '/';
    return request;
  }

  return request;
}
