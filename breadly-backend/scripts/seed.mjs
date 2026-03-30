#!/usr/bin/env node
/**
 * seed.mjs — Seed script for preview environments.
 *
 * Seeds the preview environment with demo data by calling the API directly.
 * This approach is database-agnostic and will survive the planned MongoDB-to-DynamoDB migration.
 *
 * Usage:
 *   node scripts/seed.mjs --api-url <url> --token <jwt>
 *
 * Arguments:
 *   --api-url   Base URL of the preview API (e.g. https://<cf>.cloudfront.net/preview/<slug>)
 *   --token     Valid JWT for an authenticated user (obtained via Cognito)
 *
 * Behaviour:
 *   - Checks if data already exists before seeding (skips if non-empty).
 *   - POSTs each object from seed-data/*.json to the corresponding API endpoint.
 *
 * Status: Placeholder — seeding logic will be implemented when the API stabilises.
 */

console.log('Seed script placeholder — seeding logic not yet implemented.');
console.log('Seed data files are located in breadly-backend/seed-data/.');
