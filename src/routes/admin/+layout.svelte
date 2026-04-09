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
</script>

{#if auth.isEmployee}
	{@render children()}
{:else if auth.isLoggedIn}
	<p>Access denied</p>
{/if}
