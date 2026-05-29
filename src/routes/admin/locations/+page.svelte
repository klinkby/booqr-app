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
	<div class="mt-6 flex justify-center">
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			onclick={handleCreate}
			type="button"
			>Create Location
		</button>
	</div>
</div>
