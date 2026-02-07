<script>
	import { LocationService } from '$lib/api';
	import { PaginatedTable } from '$lib';

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'address1', label: 'Address' },
		{ key: 'zip', label: 'Zip' },
		{ key: 'city', label: 'City' }
	];
	const fetchCommand = LocationService.getLocations;
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6">Locations</h1>
	<PaginatedTable {columns} {fetchCommand} />
</div>