<script>
	import { AuthenticationService } from '$lib/api';
	import { setAccessToken, isValidToken } from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state(null);
	let loading = $state(false);

	async function handleSubmit(event) {
		event.preventDefault();
		error = null;
		loading = true;

		try {
			const response = await AuthenticationService.login({
				email,
				password
			});

			// Store access token (response should contain token)
			if (response.access_token) {
				setAccessToken(response.access_token);
				// Clear password from memory
				password = '';
				// Redirect to home or dashboard
				await goto('/');
			} else {
				error = 'Authentication failed. Please try again.';
			}
		} catch (err) {
			// Generic error message to avoid information disclosure
			error = 'Authentication failed. Please check your credentials.';
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		try {
			// Try to refresh token on start
			const response = await AuthenticationService.refresh();
			if (response.access_token && isValidToken(response.access_token)) {
				setAccessToken(response.access_token);
				goto('/');
			}
		} catch (err) {
			// Silent fail for background refresh on login page
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
		</div>
		<form class="mt-8 space-y-6" onsubmit={handleSubmit} novalidate>
			{#if error}
				<div class="rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-800">{error}</p>
				</div>
			{/if}

			<div class="rounded-md shadow-sm space-y-4">
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
						class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
						class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
			</div>
		</form>
	</div>
</div>
