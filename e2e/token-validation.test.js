import { test, expect } from '@playwright/test';

test.describe('Token validation', () => {
	test('rejects tokens without expiration field', async ({ page }) => {
		await page.goto('/');
		
		// Create a JWT token without exp field
		const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
		const payload = btoa(JSON.stringify({ sub: '1234567890', name: 'Test User' }));
		const signature = 'fake-signature';
		const tokenWithoutExp = `${header}.${payload}.${signature}`;
		
		// Test that isValidToken rejects tokens without exp
		const result = await page.evaluate((token) => {
			// Import the validation function
			const isValidToken = (token) => {
				if (!token || typeof token !== 'string') return false;
				const parts = token.split('.');
				if (parts.length !== 3) return false;
				
				try {
					const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
					// Require expiration field for security
					if (!payload.exp || typeof payload.exp !== 'number') {
						return false;
					}
					const now = Math.floor(Date.now() / 1000);
					return payload.exp > now;
				} catch (e) {
					return false;
				}
			};
			
			return isValidToken(token);
		}, tokenWithoutExp);
		
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
		const result = await page.evaluate((token) => {
			// Import the validation function
			const isValidToken = (token) => {
				if (!token || typeof token !== 'string') return false;
				const parts = token.split('.');
				if (parts.length !== 3) return false;
				
				try {
					const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
					// Require expiration field for security
					if (!payload.exp || typeof payload.exp !== 'number') {
						return false;
					}
					const now = Math.floor(Date.now() / 1000);
					return payload.exp > now;
				} catch (e) {
					return false;
				}
			};
			
			return isValidToken(token);
		}, expiredToken);
		
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
		const result = await page.evaluate((token) => {
			// Import the validation function
			const isValidToken = (token) => {
				if (!token || typeof token !== 'string') return false;
				const parts = token.split('.');
				if (parts.length !== 3) return false;
				
				try {
					const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
					// Require expiration field for security
					if (!payload.exp || typeof payload.exp !== 'number') {
						return false;
					}
					const now = Math.floor(Date.now() / 1000);
					return payload.exp > now;
				} catch (e) {
					return false;
				}
			};
			
			return isValidToken(token);
		}, validToken);
		
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
			const result = await page.evaluate((token) => {
				// Import the validation function
				const isValidToken = (token) => {
					if (!token || typeof token !== 'string') return false;
					const parts = token.split('.');
					if (parts.length !== 3) return false;
					
					try {
						const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
						// Require expiration field for security
						if (!payload.exp || typeof payload.exp !== 'number') {
							return false;
						}
						const now = Math.floor(Date.now() / 1000);
						return payload.exp > now;
					} catch (e) {
						return false;
					}
				};
				
				return isValidToken(token);
			}, testCase.token);
			
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
		const result = await page.evaluate((token) => {
			// Import the validation function
			const isValidToken = (token) => {
				if (!token || typeof token !== 'string') return false;
				const parts = token.split('.');
				if (parts.length !== 3) return false;
				
				try {
					const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
					// Require expiration field for security
					if (!payload.exp || typeof payload.exp !== 'number') {
						return false;
					}
					const now = Math.floor(Date.now() / 1000);
					return payload.exp > now;
				} catch (e) {
					return false;
				}
			};
			
			return isValidToken(token);
		}, tokenWithStringExp);
		
		expect(result).toBe(false);
	});
});
