<script>
	import DataTable from './DataTable.svelte';

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
	} = $props();
</script>

{#if isLoading}
	<div role="status" aria-live="polite">
		<p>Loading...</p>
	</div>
{:else if error}
	<div role="alert" aria-live="assertive">
		<p class="text-red-600">{error}</p>
	</div>
{:else if rows.length === 0}
	<p>No items found.</p>
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
	/>
{/if}
