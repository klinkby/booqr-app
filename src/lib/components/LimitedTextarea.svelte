<script>
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
	<label for={id} class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
	<textarea
		{id}
		{name}
		{rows}
		{maxlength}
		{disabled}
		bind:value
		class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
	></textarea>
	{#if value.length > maxlength - countLast}
		<p class="mt-1 text-sm text-gray-500">{value.length}/{maxlength}</p>
	{/if}
</div>
