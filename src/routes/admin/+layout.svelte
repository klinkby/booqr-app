<script>
	import {auth} from '$lib';
	import {goto} from '$app/navigation';
	import {page} from '$app/stores';

	let {children} = $props();

	$effect(() => {
		if (!auth.isLoggedIn) {
			goto(`/login?returnUrl=${encodeURIComponent($page.url.pathname)}`);
		}
	});
</script>

{#if auth.isEmployee}
	<nav aria-label="Admin navigation" class="bg-gray-100 border-b">
		<div class="container mx-auto flex gap-4 p-3 text-sm">
			<a href="/admin/calendar" class="hover:text-gray-900 text-gray-600">Calendar</a>
			<a href="/admin/services" class="hover:text-gray-900 text-gray-600">Services</a>
			<a href="/admin/locations" class="hover:text-gray-900 text-gray-600">Locations</a>
			<a href="/admin/contacts" class="hover:text-gray-900 text-gray-600">Contacts</a>
		</div>
	</nav>
	{@render children()}
{:else if auth.isLoggedIn}
	<p>Access denied</p>
{/if}
