import { expect, test } from '@playwright/test';
import { setupApiMocks, setupAuthToken } from './mocks.js';

for (const path of ['/', '/profile', '/admin/plan', '/admin/services', '/admin/contacts', '/login', '/book/1']) {
	test(`no CSP violations on ${path}`, async ({ page }) => {
		const violations = [];
		const consoleMsgs = [];
		page.on('console', (m) => /content security policy/i.test(m.text()) && consoleMsgs.push(m.text()));
		await page.addInitScript(() => {
			window.__v = [];
			document.addEventListener('securitypolicyviolation', (e) =>
				window.__v.push(`${e.violatedDirective} ${e.blockedURI} ${e.sample}`),
			);
		});
		await setupApiMocks(page);
		await setupAuthToken(page);
		await page.goto(path);
		await page.waitForTimeout(1500);
		violations.push(...(await page.evaluate(() => window.__v)));
		expect([...violations, ...consoleMsgs]).toEqual([]);
	});
}
