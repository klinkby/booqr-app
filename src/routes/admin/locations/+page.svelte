<script>
	import { PaginatedTable } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useLocationsData } from './locationsData.svelte.js';

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'address1', label: 'Address', hideOnMobile: true },
		{ key: 'zip', label: 'Zip', hideOnMobile: true },
		{ key: 'city', label: 'City', hideOnMobile: true },
	];

	const locations = useLocationsData();

	function handleEdit(row) {
		goto(resolve(`/admin/locations/${row.id}`));
	}

	function handleCreate() {
		goto(resolve('/admin/locations/new'));
	}
</script>

<div>
	<div class="mb-4">
		<button
			class="px-4 py-2 text-sm font-medium text-gray-700 bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
			onclick={handleCreate}
			type="button"
			>Create Location
		</button>
	</div>
	<PaginatedTable
		{columns}
		rows={locations.items}
		isLoading={locations.isLoading}
		hasPreviousPage={locations.hasPreviousPage}
		hasNextPage={locations.hasNextPage}
		onnextpage={locations.nextPage}
		onpreviouspage={locations.previousPage}
		onedit={handleEdit}
	/>
</div>
