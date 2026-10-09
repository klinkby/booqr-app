<script>
	import { ServiceList, apiErrorMessage } from '#lib';
	import { alert, pageHeading } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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
		goto(resolve(`book/${service.id}`));
	}
</script>

<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-6 outline-none">{m.selectAServiceHeading()}</h1>

{#if home.isLoading}
	<p role="status" aria-live="polite" class="text-sm text-gray-500">{m.loading()}</p>
{:else if home.error}
	<div role="alert" aria-live="assertive" class={alert}>{apiErrorMessage(home.error, m.errorLoadServices())}</div>
{:else}
	<ServiceList services={home.services} onselect={handleSelect} />
{/if}
