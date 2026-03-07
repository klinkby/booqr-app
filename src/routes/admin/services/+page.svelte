<script>
	import {ServiceService, UserService} from '$lib/api';
	import {DataTable, invokeApi} from '$lib';
	import {goto} from '$app/navigation';
	import {onMount} from 'svelte';

	const columns = [
		{key: 'name', label: 'Name'},
		{key: 'duration', label: 'Duration'},
		{key: 'employeeNames', label: 'Employees'}
	];

	let rows = $state([]);
	let loading = $state(true);
	let error = $state(null);

	function handleEdit(row) { goto(`/admin/services/${row.id}`); }
	function handleCreate() { goto('/admin/services/new'); }

	onMount(async () => {
		try {
			const [servicesRes, empRes] = await Promise.all([
				invokeApi(() => ServiceService.getServices()),
				invokeApi(() => UserService.getUsers(undefined, 'Employee'))
			]);
			const empMap = Object.fromEntries(empRes.items.map(e => [e.id, e.name || e.email]));
			rows = servicesRes.items.map(s => ({
				...s,
				employeeNames: (s.employees || []).map(id => empMap[id] ?? id).join(', ')
			}));
		} catch (err) {
			if (import.meta.env.DEV) console.error('Failed to fetch services:', err);
			error = 'Failed to load services. Please try again.';
		} finally {
			loading = false;
		}
	});
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
	{#if loading}
		<div role="status" aria-live="polite"><p>Loading...</p></div>
	{:else if error}
		<div role="alert" aria-live="assertive"><p class="text-red-600">{error}</p></div>
	{:else if rows.length === 0}
		<p>No services found.</p>
	{:else}
		<DataTable {columns} {rows} onedit={handleEdit}/>
	{/if}
</div>
