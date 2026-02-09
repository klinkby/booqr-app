<script>
	import {ServiceService} from '$lib/api';
	import {PaginatedTable} from '$lib';
	import {goto} from '$app/navigation';

	const columns = [
		{key: 'name', label: 'Name'},
		{key: 'duration', label: 'Duration'}
	];
	const fetchCommand = ServiceService.getServices;

	function handleEdit(row) {
		goto(`/admin/services/${row.id}`);
	}

	function handleCreate() {
		goto('/admin/services/new');
	}
</script>

<div>
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-3xl font-bold">Services</h1>
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			onclick={handleCreate}
			type="button"
		>Create Service
		</button>
	</div>
	<PaginatedTable {columns} {fetchCommand} onedit={handleEdit}/>
</div>
