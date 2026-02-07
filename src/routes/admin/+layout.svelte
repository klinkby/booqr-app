<script>
	import { auth } from '$lib';
	import { goto } from '$app/navigation';

	let { children } = $props();

	$effect(() => {
		if (!auth.isLoggedIn) {
			goto('/login');
		}
	});
</script>

{#if auth.isEmployee}
	{@render children()}
{:else if auth.isLoggedIn}
	<p>Access denied</p>
{/if}
