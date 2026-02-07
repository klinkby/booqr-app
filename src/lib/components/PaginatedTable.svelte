<script>
	import DataTable from './DataTable.svelte';
	import { invokeApi } from '$lib/invokeApi';
	import { onMount } from 'svelte';

	let { columns, fetchCommand, onedit = undefined, ondelete = undefined } = $props();

	const PAGE_SIZE = 100;
	let rows = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let start = $state(0);
	let hasNextPage = $state(false);

	async function fetchBatch() {
		loading = true;
		error = null;
		try {
			const response = await invokeApi(() => fetchCommand(start, PAGE_SIZE));
			rows = response.items;
			hasNextPage = response.items.length === PAGE_SIZE;
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to fetch items:', err);
			}
			error = 'Failed to load items. Please try again.';
		} finally {
			loading = false;
		}
	}

	function nextPage() {
		start += PAGE_SIZE;
		fetchBatch();
	}

	function previousPage() {
		start = Math.max(0, start - PAGE_SIZE);
		fetchBatch();
	}

	onMount(() => {
		fetchBatch();
	});
</script>

{#if loading}
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
		hasPreviousPage={start > 0}
		{hasNextPage}
		onnextpage={nextPage}
		onpreviouspage={previousPage}
		{onedit}
		{ondelete}
	/>
{/if}