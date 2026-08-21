<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});

	let employeeName = $derived(page.url.searchParams.get('employee') || m.yourProvider());
	let locationName = $derived(page.url.searchParams.get('location') || m.theLocation());
</script>

<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-4 outline-none">{m.thankYouForBooking()}</h1>

<p class="text-gray-600 mb-6">
	{m.appointmentConfirmed({ employee: employeeName, location: locationName })}
</p>

<a href={resolve('/')} class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">
	{m.bookAnotherAppointment()}
</a>
