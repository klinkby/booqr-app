<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { AuthenticationService } from '$lib/api';
	import { clearAccessToken, authState } from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	async function handleLogout(event) {
		event.preventDefault();

		try {
			await AuthenticationService.logout();
		} catch (err) {
			// Continue with logout even if API call fails
			// Don't log error to console in production for security
		} finally {
			clearAccessToken();
			goto('/');
		}
	}

	onMount(() => {
		// Listen for storage changes to update auth state (for other tabs)
		const checkAuth = () => authState.refresh();
		window.addEventListener('storage', checkAuth);
		return () => window.removeEventListener('storage', checkAuth);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Skip link for keyboard users -->
<a class="sr-only focus:not-sr-only" href="#main">Skip to content</a>

<header>
	<nav aria-label="Main navigation" class="bg-gray-800 text-white p-4">
		<div class="container mx-auto flex gap-6">
			<a href="/" class="hover:text-gray-300">Home</a>
			<a href="/calendar" class="hover:text-gray-300">Calendar</a>
			{#if authState.isLoggedIn}
				<button onclick={handleLogout} class="hover:text-gray-300">Logout</button>
			{:else}
				<a href="/login" class="hover:text-gray-300">Login</a>
			{/if}
		</div>
	</nav>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="bg-gray-100 text-gray-600 p-4 mt-8">
	<div class="container mx-auto text-sm">
		<small>&copy; {new Date().getFullYear()} Booqr</small>
	</div>
</footer>
