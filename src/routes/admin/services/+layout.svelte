<script>
	import AdminOnly from '../AdminOnly.svelte';

	let { children } = $props();
</script>

<AdminOnly>{@render children()}</AdminOnly>
