<script>
	import { m } from '#lib/paraglide/messages.js';

	let { items = [] } = $props();
</script>

{#if items.length > 0}
	<p class="mb-4 text-sm text-gray-500" aria-label={m.selectionsLabel()}>
		{items.join(' · ')}
	</p>
{/if}
