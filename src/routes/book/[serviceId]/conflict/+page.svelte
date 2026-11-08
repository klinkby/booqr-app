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
	// Keep an employee's "book on behalf of" contact when starting over.
	let customerParam = $derived(page.url.searchParams.get('customer'));
	let bookingBaseHref = $derived(resolve(`book/${page.params.serviceId}`));
	let anotherTimeHref = $derived(query({ date: dateParam, customer: customerParam }));
	let differentDayHref = $derived(query({ customer: customerParam }));

	function query(values) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams();
		for (const [k, v] of Object.entries(values)) if (v) params.set(k, v);
		return params.size ? `${bookingBaseHref}?${params}` : bookingBaseHref;
	}
</script>

<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-4 outline-none">{m.timeTaken()}</h1>

<p class="mb-6 text-sm text-gray-500">{m.timeTakenMessage()}</p>

<div class="flex flex-col gap-2">
	<!-- eslint-disable svelte/no-navigation-without-resolve -- bookingBaseHref is already built from resolve(); a query string is appended after -->
	<a href={anotherTimeHref} class="{link} text-sm">
		{m.chooseAnotherTime()}
	</a>
	<a href={differentDayHref} class="{link} text-sm">
		{m.chooseDifferentDay()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
