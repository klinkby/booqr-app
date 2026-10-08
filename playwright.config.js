import { existsSync } from 'fs';
import { join } from 'path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load .env file for test credentials
dotenv.config({ quiet: true });

// CI / remote environments pre-install Chromium and set PLAYWRIGHT_BROWSERS_PATH
// to skip downloading. The revision shipped with the pinned @playwright/test
// version may differ from the pre-installed one; the `chromium` symlink inside
// that directory always points to the current binary regardless of revision.
const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
const chromiumSymlink = browsersPath ? join(browsersPath, 'chromium') : null;
const executablePath = chromiumSymlink && existsSync(chromiumSymlink) ? chromiumSymlink : undefined;

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'e2e',
	// These specs run against route mocks and settle in well under a second when
	// healthy, so a hang means a real failure. Keep timeouts tight so the suite
	// fails fast instead of stalling on the 30s default.
	timeout: 15_000,
	expect: { timeout: 5_000 },
	use: {
		baseURL: 'http://localhost:4173',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				headless: true,
				...(executablePath && { launchOptions: { executablePath } }),
			},
		},
	],
});
