<script>
	import { ServiceService } from '$lib/api';
	import { PaginatedTable } from '$lib';

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'duration', label: 'Duration' }
	];
	const fetchCommand = ServiceService.getServices;
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6">Services</h1>
	<PaginatedTable {columns} {fetchCommand} />
</div>
