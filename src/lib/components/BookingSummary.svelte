<script>
	let { items = [] } = $props();
</script>

{#if items.length > 0}
	<p class="text-sm text-gray-600 mb-4" aria-label="Your selections so far">
		{items.join(' · ')}
	</p>
{/if}
