<script>
	import { resolve } from '$app/paths';
	import { link } from '#lib/ui.js';

	let { id = 0, name = '' } = $props();
</script>

<a href={resolve('/admin/contacts/[id]', { id: String(id) })} class={link}>{name}</a>
