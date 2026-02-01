import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Load .env file for test credentials
dotenv.config();

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'e2e',
	use: {
		baseURL: 'http://localhost:4173'
	}
});
