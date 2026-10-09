<script>
	import DataTable from './DataTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { alert as alertClass, card, cardSection } from '#lib/ui.js';

	let {
		columns,
		rows = [],
		isLoading = false,
		error = null,
		hasPreviousPage = false,
		hasNextPage = false,
		onnextpage = undefined,
		onpreviouspage = undefined,
		onedit = undefined,
		ondelete = undefined,
		cellContent = undefined,
		caption = undefined,
	} = $props();
</script>

{#if isLoading}
	<div class="{card} {cardSection}" role="status" aria-live="polite">
		<p class="text-sm text-gray-500">{m.loading()}</p>
	</div>
{:else if error}
	<div role="alert" aria-live="assertive" class={alertClass}>
		<p>{error}</p>
	</div>
{:else if rows.length === 0}
	<div class="{card} {cardSection}">
		<p class="text-sm text-gray-500">{m.noItemsFound()}</p>
	</div>
{:else}
	<DataTable
		{columns}
		{rows}
		{hasPreviousPage}
		{hasNextPage}
		{onnextpage}
		{onpreviouspage}
		{onedit}
		{ondelete}
		{cellContent}
		{caption}
	/>
{/if}
