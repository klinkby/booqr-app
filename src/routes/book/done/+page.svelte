<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});

	let employeeName = $derived(page.url.searchParams.get('employee') || 'your provider');
	let locationName = $derived(page.url.searchParams.get('location') || 'the location');
</script>

<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-4 outline-none">Thank you for booking</h1>

<p class="text-gray-600 mb-6">
	Your appointment with {employeeName} at {locationName} is confirmed. A confirmation email is on its way.
</p>

<a href={resolve('/')} class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">
	Book another appointment
</a>
