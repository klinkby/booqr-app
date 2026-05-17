<script>
	import { ServiceService, UserService } from '$lib/api';
	import { DataTable, UserName, invokeApi, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'duration', label: 'Duration', hideOnMobile: true },
		{ key: 'employeeUsers', label: 'Employees', hideOnMobile: true },
	];

	let rows = $state([]);
	let loading = $state(true);
	let error = $state(null);

	function handleEdit(row) {
		goto(resolve(`/admin/services/${row.id}`));
	}
	function handleCreate() {
		goto(resolve('/admin/services/new'));
	}

	onMount(async () => {
		try {
			const [servicesRes, empRes] = await Promise.all([
				invokeApi(() => ServiceService.getServices()),
				invokeApi(() => UserService.getUsers(undefined, 'Employee', 1000, 0)),
			]);
			const empMap = Object.fromEntries(empRes.items.map((e) => [e.id, e]));
			rows = servicesRes.items.map((s) => ({
				...s,
				employeeUsers: (s.employees || []).map((id) => empMap[id]).filter(Boolean),
			}));
		} catch (err) {
			if (import.meta.env.DEV) console.error('Failed to fetch services:', err);
			error = apiErrorMessage(err);
		} finally {
			loading = false;
		}
	});
</script>

<div>
	{#if loading}
		<div role="status" aria-live="polite"><p>Loading...</p></div>
	{:else if error}
		<div role="alert" aria-live="assertive"><p class="text-red-600">{error}</p></div>
	{:else if rows.length === 0}
		<p>No services found.</p>
	{:else}
		{#snippet cellContent(column, row)}
			{#if column.key === 'employeeUsers'}
				<span class="flex flex-col gap-1">
					{#each row.employeeUsers as emp (emp.id)}
						<UserName name={emp.name || emp.email} email={emp.email} />
					{/each}
				</span>
			{:else}
				{row[column.key]}
			{/if}
		{/snippet}
		<DataTable {columns} {rows} onedit={handleEdit} {cellContent} />
	{/if}
	<div class="mt-6 flex justify-center">
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			onclick={handleCreate}
			type="button"
			>Create Service
		</button>
	</div>
</div>
