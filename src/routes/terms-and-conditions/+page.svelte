<script>
	import { m } from '$lib/paraglide/messages.js';

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});
</script>

<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-4 outline-none">{m.termsAndConditions()}</h1>

<p class="text-gray-600">
	{m.termsPlaceholder()}
</p>
