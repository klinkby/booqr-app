<script>
	import { m } from '$lib/paraglide/messages.js';

	let { items = [] } = $props();
</script>

{#if items.length > 0}
	<p class="text-sm text-gray-600 mb-4" aria-label={m.selectionsLabel()}>
		{items.join(' · ')}
	</p>
{/if}
