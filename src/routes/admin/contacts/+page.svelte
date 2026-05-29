<script>
	import { PaginatedTable, UserName } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useContactsData } from './contactsData.svelte.js';

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'role', label: 'Role', hideOnMobile: true },
	];

	const contacts = useContactsData();

	function handleEdit(row) {
		goto(resolve(`/admin/contacts/${row.id}`));
	}

	function handleCreate() {
		goto(resolve('/admin/contacts/new'));
	}
</script>

<div>
	{#snippet cellContent(column, row)}
		{#if column.key === 'name'}
			<UserName name={row.name} email={row.email} />
		{:else}
			{row[column.key]}
		{/if}
	{/snippet}
	<PaginatedTable
		{columns}
		rows={contacts.items}
		isLoading={contacts.isLoading}
		hasPreviousPage={contacts.hasPreviousPage}
		hasNextPage={contacts.hasNextPage}
		onnextpage={contacts.nextPage}
		onpreviouspage={contacts.previousPage}
		onedit={handleEdit}
		{cellContent}
	/>
	<div class="mt-6 flex justify-center">
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			onclick={handleCreate}
			type="button"
			>Create Contact
		</button>
	</div>
</div>
