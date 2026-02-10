<script>
	import {AuthenticationService} from '$lib/api';
	import {auth, Form, PasswordReset} from '$lib';
	import {goto} from '$app/navigation';
	import {page} from '$app/stores';

	let showPasswordReset = $state(false);

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
		<Form {error} legend="Sign in" {loading} onsubmit={handleSubmit} submitLabel="Sign in">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="email">
					Email address
				</label>
				<input
					autocomplete="email"
					bind:value={email}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					id="email"
					name="email"
					placeholder="Email address"
					required
					type="email"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="password">
					Password
				</label>
				<input
					autocomplete="current-password"
					bind:value={password}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					id="password"
					name="password"
					placeholder="Password"
					required
					type="password"
				/>
			</div>
		</Form>

		<p class="mt-4 text-sm text-gray-600">
			<button
				type="button"
				onclick={() => showPasswordReset = !showPasswordReset}
				class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
			>
				{showPasswordReset ? 'Back to sign in' : 'Forgot your password?'}
			</button>
		</p>

		{#if showPasswordReset}
			<section aria-labelledby="reset-heading" class="mt-4">
				<h2 id="reset-heading" class="text-lg font-semibold mb-3">Reset Password</h2>
				<PasswordReset bind:email={email} />
			</section>
		{/if}
	</div>
</div>
