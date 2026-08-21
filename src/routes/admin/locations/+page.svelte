<script>
	import { PaginatedTable } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useLocationsData } from './locationsData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

	const columns = [
		{ key: 'name', label: m.labelName() },
		{ key: 'address1', label: m.labelAddress(), hideOnMobile: true },
		{ key: 'zip', label: m.labelZip(), hideOnMobile: true },
		{ key: 'city', label: m.labelCity(), hideOnMobile: true },
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
			class="px-4 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
			onclick={handleCreate}
			type="button"
			>{m.createLocation()}
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
