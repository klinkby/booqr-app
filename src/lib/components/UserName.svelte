<script>
	import Avatar from './Avatar.svelte';

	let { name = '', email = '' } = $props();
</script>

<a
	href="mailto:{email}"
	target="_blank"
	rel="noreferrer"
	class="flex items-center gap-1 text-indigo-600 hover:underline"
>
	<Avatar {email} size="1rem" />
	{name}
</a>
