<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import {AuthenticationService} from '$lib/api';
	import {auth} from '$lib';
	import {goto} from '$app/navigation';

	let {children} = $props();

	async function handleLogout(event) {
		event.preventDefault();

		try {
			await AuthenticationService.logout();
		} catch (err) {
			// Continue with logout even if API call fails
			// Don't log error to console in production for security
		} finally {
			auth.clear();
			goto('/');
		}
	}
</script>

<svelte:head>
	<link href={favicon} rel="icon"/>
</svelte:head>

<!-- Skip link for keyboard users -->
<a class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
	 href="#main-content">
	Skip to main content
</a>
<header class="bg-gray-800 dark:bg-gray-900 text-white">
	<nav aria-label="Main navigation" class="container mx-auto px-4 py-4 max-w-7xl">
		<div class="flex gap-6">
			<a class="hover:text-gray-300 dark:hover:text-gray-400" href="/">Home</a>
			{#if auth.isEmployee}
				<a href="/admin/calendar" class="hover:text-gray-300 dark:hover:text-gray-400">Admin</a>
			{/if}
			{#if auth.isLoggedIn}
				<a href="/profile" class="hover:text-gray-300 dark:hover:text-gray-400">My Profile</a>
				<button onclick={handleLogout} class="hover:text-gray-300 dark:hover:text-gray-400">Logout</button>
			{:else}
				<a href="/login" class="hover:text-gray-300 dark:hover:text-gray-400">Login</a>
			{/if}
		</div>
	</nav>
</header>

<main class="container mx-auto px-4 py-8 max-w-7xl bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen" id="main-content">
	{@render children()}
</main>

<footer class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mt-8">
	<div class="container mx-auto px-4 py-4 max-w-7xl text-sm">
		<small>&copy; {new Date().getFullYear()} Booqr</small>
	</div>
</footer>
