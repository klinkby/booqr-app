<script>
	let heading = $state();

	$effect(() => {
		heading?.focus();
	});
</script>

<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-4 outline-none">Terms and Conditions</h1>

<p class="text-gray-600">
	These terms and conditions are coming soon. By creating an account you agree to use this service responsibly.
</p>
