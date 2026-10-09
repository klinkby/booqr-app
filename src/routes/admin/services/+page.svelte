<script>
	import { DataTable, UserName, apiErrorMessage } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useServicesData } from './servicesData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { alert as alertClass, buttonSecondary, card, cardSection } from '#lib/ui.js';

	const columns = [
		{ key: 'name', label: m.labelName() },
		{ key: 'duration', label: m.labelDuration(), hideOnMobile: true },
		{ key: 'employeeUsers', label: m.employees(), hideOnMobile: true },
	];

	const services = useServicesData();

	function handleEdit(row) {
		goto(resolve(`admin/services/${row.id}`));
	}
	function handleCreate() {
		goto(resolve('admin/services/new'));
	}
</script>

<div>
	<div class="mb-4 flex items-center justify-between">
		<button class={buttonSecondary} onclick={handleCreate} type="button">{m.createService()}</button>
	</div>
	{#if services.isLoading}
		<div class="{card} {cardSection}" role="status" aria-live="polite">
			<p class="text-sm text-gray-500">{m.loading()}</p>
		</div>
	{:else if services.error}
		<div role="alert" aria-live="assertive" class={alertClass}>
			<p>{apiErrorMessage(services.error)}</p>
		</div>
	{:else if services.rows.length === 0}
		<div class="{card} {cardSection}">
			<p class="text-sm text-gray-500">{m.noServicesFound()}</p>
		</div>
	{:else}
		{#snippet cellContent(column, row)}
			{#if column.key === 'employeeUsers'}
				<span class="flex flex-col gap-2">
					{#each row.employeeUsers as emp (emp.id)}
						<UserName id={emp.id} name={emp.name || emp.email} />
					{/each}
				</span>
			{:else}
				{row[column.key]}
			{/if}
		{/snippet}

		<DataTable {columns} rows={services.rows} onedit={handleEdit} {cellContent} caption={m.titleServices()} />
	{/if}
</div>
