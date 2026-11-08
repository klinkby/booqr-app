<script>
	import { ServiceList, apiError, ErrorMessage } from '#lib';
	import { alert, pageHeading } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { useHomeData } from './homeData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	const home = useHomeData();

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});

	onMount(() => {
		// Starting a fresh booking from the home page clears any abandoned rebook
		// intent, so a new booking never deletes a previously-selected booking.
		try {
			sessionStorage.removeItem('pendingRebook');
		} catch {
			// sessionStorage unavailable — nothing to clear
		}
	});

	function handleSelect(service) {
		// Carry an employee's "book on behalf of" contact (from /admin/contacts)
		// into the wizard; the confirm step decides whether to honour it.
		const customer = page.url.searchParams.get('customer');
		const query = customer ? `?customer=${encodeURIComponent(customer)}` : '';
		goto(resolve(`book/${service.id}${query}`));
	}
</script>

<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-6 outline-none">{m.selectAServiceHeading()}</h1>

{#if home.isLoading}
	<p role="status" aria-live="polite" class="text-sm text-gray-500">{m.loading()}</p>
{:else if home.error}
	<div role="alert" aria-live="assertive" class={alert}>
		<ErrorMessage error={apiError(home.error, m.errorLoadServices())} />
	</div>
{:else}
	<ServiceList services={home.services} onselect={handleSelect} />
{/if}
