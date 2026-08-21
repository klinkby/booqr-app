<script>
	import { DataTable, UserName, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useServicesData } from './servicesData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

	const columns = [
		{ key: 'name', label: m.labelName() },
		{ key: 'duration', label: m.labelDuration(), hideOnMobile: true },
		{ key: 'employeeUsers', label: m.employees(), hideOnMobile: true },
	];

	const services = useServicesData();

	function handleEdit(row) {
		goto(resolve(`/admin/services/${row.id}`));
	}
	function handleCreate() {
		goto(resolve('/admin/services/new'));
	}
</script>

<div>
	<div class="mb-4">
		<button
			class="px-4 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
			onclick={handleCreate}
			type="button"
			>{m.createService()}
		</button>
	</div>
	{#if services.isLoading}
		<div role="status" aria-live="polite"><p>{m.loading()}</p></div>
	{:else if services.error}
		<div role="alert" aria-live="assertive"><p class="text-red-600">{apiErrorMessage(services.error)}</p></div>
	{:else if services.rows.length === 0}
		<p>{m.noServicesFound()}</p>
	{:else}
		{#snippet cellContent(column, row)}
			{#if column.key === 'employeeUsers'}
				<span class="flex flex-col gap-1">
					{#each row.employeeUsers as emp (emp.id)}
						<UserName id={emp.id} name={emp.name || emp.email} email={emp.email} />
					{/each}
				</span>
			{:else}
				{row[column.key]}
			{/if}
		{/snippet}
		<DataTable {columns} rows={services.rows} onedit={handleEdit} {cellContent} />
	{/if}
</div>
