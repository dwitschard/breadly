import { test, expect } from '@playwright/test';

const TARGET_URL =
  'https://www.aletscharena.ch/planen-buchen/angebote-erlebnisse/cube-aletsch';

test.describe('Smoke: Cube Aletsch booking monitor', () => {
  test('booking is NOT yet available', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const content = page.locator('main');

    // Collect all signals — if ANY condition flips, booking may be live.
    const signals: string[] = [];

    // --- Group A: warnings still present ---
    if (await page.getByText('Wichtige Mitteilung').isHidden()) {
      signals.push('"Wichtige Mitteilung" notice was removed');
    }

    if (
      await page
        .getByText(
          'Die Daten für den Cube Aletsch Sommer 2026 werden erst im Frühjahr aufgeschaltet.',
        )
        .first()
        .isHidden()
    ) {
      signals.push('Postponement text was removed');
    }

    // --- Group B: no booking CTAs outside navbar ---
    if (await content.getByText('Jetzt buchen').first().isVisible().catch(() => false)) {
      signals.push('"Jetzt buchen" appeared in content area');
    }

    if (await content.locator('.btn--conversion').isVisible().catch(() => false)) {
      signals.push('A .btn--conversion button appeared in content area');
    }

    if (
      await content
        .locator('*.btn')
        .filter({ hasText: /buchen/i })
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      signals.push('"buchen" (exact) appeared in content area');
    }

    if (
      await content
        .getByText('Buchen', { exact: true })
        .isVisible()
        .catch(() => false)
    ) {
      signals.push('"Buchen" (exact) appeared in content area');
    }

    // --- Group C: no booking infrastructure ---
    if (await content.locator('iframe').isVisible().catch(() => false)) {
      signals.push('An <iframe> appeared in the content area');
    }

    // Check JSON-LD for availability / date fields
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    for (let i = 0; i < count; i++) {
      const text = (await jsonLdScripts.nth(i).textContent()) ?? '';
      if (text.includes('"availability"')) {
        signals.push('JSON-LD now contains "availability" property');
      }
      if (text.includes('"validFrom"')) {
        signals.push('JSON-LD now contains "validFrom" property');
      }
    }

    // --- Verdict ---
    expect(signals, `Booking may be live!\n${signals.join('\n')}`).toHaveLength(
      0,
    );
  });
});
