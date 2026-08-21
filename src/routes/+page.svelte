<script>
	import { ServiceList, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useHomeData } from './homeData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

	const home = useHomeData();

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});

	function handleSelect(service) {
		goto(resolve(`/book/${service.id}`));
	}
</script>

<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.selectAServiceHeading()}</h1>

{#if home.isLoading}
	<div role="status" aria-live="polite"><p>{m.loading()}</p></div>
{:else if home.error}
	<div role="alert" aria-live="assertive">
		<p class="text-red-600">{apiErrorMessage(home.error, m.errorLoadServices())}</p>
	</div>
{:else}
	<ServiceList services={home.services} onselect={handleSelect} />
{/if}
