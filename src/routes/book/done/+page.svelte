<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { link, pageHeading } from '#lib/ui.js';

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});

	let employeeName = $derived(page.url.searchParams.get('employee') || m.yourProvider());
	let locationName = $derived(page.url.searchParams.get('location') || m.theLocation());
</script>

<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-4 outline-none">{m.thankYouForBooking()}</h1>

<p class="mb-6 text-sm text-gray-500">
	{m.appointmentConfirmed({ employee: employeeName, location: locationName })}
</p>

<a href={resolve('/')} class="{link} text-sm">
	{m.bookAnotherAppointment()}
</a>
