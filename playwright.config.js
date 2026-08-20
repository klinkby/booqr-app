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
