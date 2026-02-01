import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the axiosConfig.js file to extract isValidToken function
const axiosConfigPath = join(__dirname, '..', 'src', 'lib', 'axiosConfig.js');
const axiosConfigSource = readFileSync(axiosConfigPath, 'utf-8');

// Helper to test token validation in the browser context using the actual implementation
async function testTokenValidation(page, token) {
	return await page.evaluate(
		({ token, axiosConfigSource }) => {
			// Extract and execute isValidToken function from source
			const funcMatch = axiosConfigSource.match(
				/export function isValidToken\(token\) \{[\s\S]*?\n\}/
			);
			if (!funcMatch) throw new Error('Could not find isValidToken function');

			// Create a function from the source
			const funcBody = funcMatch[0]
				.replace('export function isValidToken(token) {', '')
				.replace(/\}$/, '');
			const isValidToken = new Function('token', funcBody);

			return isValidToken(token);
		},
		{ token, axiosConfigSource }
	);
}

test.describe('Token validation', () => {
	test('rejects tokens without expiration field', async ({ page }) => {
		await page.goto('/');
		
		// Create a JWT token without exp field
		const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
		const payload = btoa(JSON.stringify({ sub: '1234567890', name: 'Test User' }));
		const signature = 'fake-signature';
		const tokenWithoutExp = `${header}.${payload}.${signature}`;
		
		// Test that isValidToken rejects tokens without exp
		const result = await testTokenValidation(page, tokenWithoutExp);
		
		expect(result).toBe(false);
	});
	
	test('rejects expired tokens', async ({ page }) => {
		await page.goto('/');
		
		// Create a JWT token with expired timestamp
		const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
		const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
		const payload = btoa(JSON.stringify({ sub: '1234567890', name: 'Test User', exp: expiredTime }));
		const signature = 'fake-signature';
		const expiredToken = `${header}.${payload}.${signature}`;
		
		// Test that isValidToken rejects expired tokens
		const result = await testTokenValidation(page, expiredToken);
		
		expect(result).toBe(false);
	});
	
	test('accepts valid tokens with future expiration', async ({ page }) => {
		await page.goto('/');
		
		// Create a JWT token with future expiration
		const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
		const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
		const payload = btoa(JSON.stringify({ sub: '1234567890', name: 'Test User', exp: futureTime }));
		const signature = 'fake-signature';
		const validToken = `${header}.${payload}.${signature}`;
		
		// Test that isValidToken accepts valid tokens
		const result = await testTokenValidation(page, validToken);
		
		expect(result).toBe(true);
	});
	
	test('rejects malformed tokens', async ({ page }) => {
		await page.goto('/');
		
		const testCases = [
			{ token: null, name: 'null' },
			{ token: '', name: 'empty string' },
			{ token: 'not.a.token', name: 'invalid base64' },
			{ token: 'only-one-part', name: 'only one part' },
			{ token: 'two.parts', name: 'only two parts' },
			{ token: 'a.b.c.d', name: 'four parts' }
		];
		
		for (const testCase of testCases) {
			const result = await testTokenValidation(page, testCase.token);
			expect(result).toBe(false);
		}
	});
	
	test('rejects tokens with non-numeric exp field', async ({ page }) => {
		await page.goto('/');
		
		// Create a JWT token with string exp field
		const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
		const payload = btoa(JSON.stringify({ sub: '1234567890', name: 'Test User', exp: '2026-12-31' }));
		const signature = 'fake-signature';
		const tokenWithStringExp = `${header}.${payload}.${signature}`;
		
		// Test that isValidToken rejects tokens with non-numeric exp
		const result = await testTokenValidation(page, tokenWithStringExp);
		
		expect(result).toBe(false);
	});
});
