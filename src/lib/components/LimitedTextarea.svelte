<script>
	import { input, label as labelClass } from '#lib/ui.js';

	let {
		value = $bindable(''),
		id,
		label,
		name = id,
		rows = 3,
		maxlength = 2000,
		countLast = 150,
		disabled = false,
	} = $props();
</script>

<div>
	<label for={id} class={labelClass}>{label}</label>
	<textarea {id} {name} {rows} {maxlength} {disabled} bind:value class={input}></textarea>
	{#if value.length > maxlength - countLast}
		<p class="mt-2 text-sm text-gray-500">{value.length}/{maxlength}</p>
	{/if}
</div>
