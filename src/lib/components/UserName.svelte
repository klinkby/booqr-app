<script>
	import Avatar from './Avatar.svelte';

	let { id = 0, name = '', email = '', iconOnly = false } = $props();
</script>

<a href="/admin/contacts/{id}" class="flex items-center gap-1 text-indigo-600 hover:underline">
	<Avatar {email} size="1rem" />
	{#if !iconOnly}
		{name}
	{/if}
</a>
