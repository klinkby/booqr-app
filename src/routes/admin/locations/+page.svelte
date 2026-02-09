<script>
	import {LocationService} from '$lib/api';
	import {PaginatedTable} from '$lib';
	import {goto} from '$app/navigation';

	const columns = [
		{key: 'name', label: 'Name'},
		{key: 'address1', label: 'Address'},
		{key: 'zip', label: 'Zip'},
		{key: 'city', label: 'City'}
	];
	const fetchCommand = LocationService.getLocations;

	function handleEdit(row) {
		goto(`/admin/locations/${row.id}`);
	}

	function handleCreate() {
		goto('/admin/locations/new');
	}
</script>

<div>
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-3xl font-bold">Locations</h1>
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			onclick={handleCreate}
			type="button"
		>Create Location
		</button>
	</div>
	<PaginatedTable {columns} {fetchCommand} onedit={handleEdit}/>
</div>
