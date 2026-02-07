<script>
	import { ServiceService } from '$lib/api';
	import { DataTable } from '$lib';
	import { onMount } from 'svelte';

	const PAGE_SIZE = 100;
	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'duration', label: 'Duration' }
	];

	let rows = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let start = $state(0);
	let hasNextPage = $state(false);

	async function fetchServices() {
		loading = true;
		error = null;
		try {
			const response = await ServiceService.getServices(start, PAGE_SIZE);
			rows = response.items;
			hasNextPage = response.items.length === PAGE_SIZE;
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to fetch services:', err);
			}
			error = 'Failed to load services. Please try again.';
		} finally {
			loading = false;
		}
	}

	function nextPage() {
		start += PAGE_SIZE;
		fetchServices();
	}

	function previousPage() {
		start = Math.max(0, start - PAGE_SIZE);
		fetchServices();
	}

	onMount(() => {
		fetchServices();
	});
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6">Services</h1>

	{#if loading}
		<div role="status" aria-live="polite">
			<p>Loading services...</p>
		</div>
	{:else if error}
		<div role="alert" aria-live="assertive">
			<p class="text-red-600">{error}</p>
		</div>
	{:else if rows.length === 0}
		<p>No services found.</p>
	{:else}
		<DataTable
			{columns}
			{rows}
			hasPreviousPage={start > 0}
			{hasNextPage}
			onnextpage={nextPage}
			onpreviouspage={previousPage}
		/>
	{/if}
</div>
