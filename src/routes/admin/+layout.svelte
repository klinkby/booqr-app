<script>
	import { auth } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let { children } = $props();

	$effect(() => {
		if (!auth.isLoggedIn) {
			goto(resolve(`/login?returnUrl=${encodeURIComponent($page.url.pathname)}`));
		}
	});

	$effect(() => {
		if (auth.isLoggedIn && !auth.isEmployee) {
			const timer = setTimeout(() => goto(resolve('/')), 3000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if auth.isEmployee}
	{@render children()}
{:else if auth.isLoggedIn}
	<p role="alert">Access denied. Redirecting to home page&hellip;</p>
{/if}
