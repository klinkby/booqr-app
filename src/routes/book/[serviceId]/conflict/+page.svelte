<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { link, pageHeading } from '#lib/ui.js';

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});

	let dateParam = $derived(page.url.searchParams.get('date'));
	let bookingBaseHref = $derived(resolve(`book/${page.params.serviceId}`));
</script>

<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-4 outline-none">{m.timeTaken()}</h1>

<p class="mb-6 text-sm text-gray-500">{m.timeTakenMessage()}</p>

<div class="flex flex-col gap-2">
	<!-- eslint-disable svelte/no-navigation-without-resolve -- bookingBaseHref is already built from resolve(); a query string is appended after -->
	<a href={dateParam ? `${bookingBaseHref}?date=${dateParam}` : bookingBaseHref} class="{link} text-sm">
		{m.chooseAnotherTime()}
	</a>
	<a href={bookingBaseHref} class="{link} text-sm">
		{m.chooseDifferentDay()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
