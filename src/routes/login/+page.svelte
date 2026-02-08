<script>
	import { AuthenticationService } from '$lib/api';
	import { auth, Form } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let email = $state('');
	let password = $state('');
	let error = $state(null);
	let loading = $state(false);

	// Use $derived for reactive access to URL search params (Svelte 5 best practice)
	function normalizeReturnUrl(raw) {
		if (!raw || typeof raw !== 'string') {
			return '/';
		}

		// Only allow same-origin, absolute paths starting with a single "/"
		if (!raw.startsWith('/') || raw.startsWith('//')) {
			return '/';
		}

		// Disallow explicit schemes (e.g., "http://", "javascript:", etc.)
		if (raw.includes('://')) {
			return '/';
		}

		return raw;
	}

	let returnUrl = $derived(normalizeReturnUrl($page.url.searchParams.get('returnUrl')));
	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			const response = await AuthenticationService.login({
				email,
				password
			});
			// Clear password from memory
			password = '';
			auth.accessToken = response.access_token;
			// Store access token (response should contain token)
			if (auth.isLoggedIn) {
				// Redirect to the page that triggered login, or home if none
				await goto(returnUrl);
			} else {
				error = 'Authentication failed. Please try again.';
			}
		} catch (err) {
			// Log error in development mode for debugging
			if (import.meta.env.DEV) {
				console.error('Login error:', err);
			}
			// Try to use the error message from API if available
			error = err.message || 'Authentication failed. Please check your credentials.';
		} finally {
			loading = false;
		}
	}

</script>

<div>
	<h1 class="text-3xl font-bold mb-6">Sign in to your account</h1>

	<div class="max-w-2xl">
		<Form legend="Sign in" {error} {loading} submitLabel="Sign in" onsubmit={handleSubmit}>
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					Email address
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					placeholder="Email address"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					placeholder="Password"
				/>
			</div>
		</Form>
	</div>
</div>
