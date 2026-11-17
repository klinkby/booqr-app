<script>
	// Admin-only section guard, nested inside the admin layout (which already
	// handles signed-out users and non-employees). The API rejects every write to
	// these resources for non-admins, so an Employee is turned away here too.
	import { auth } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { alert } from '#lib/ui.js';

	let { children } = $props();

	$effect(() => {
		if (auth.isEmployee && !auth.isAdmin) {
			const timer = setTimeout(() => goto(resolve('/')), 3000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if auth.isAdmin}
	{@render children()}
{:else if auth.isEmployee}
	<p role="alert" class={alert}>{m.accessDenied()}</p>
{/if}
