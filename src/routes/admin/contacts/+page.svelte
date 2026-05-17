<script>
	import { UserService } from '$lib/api';
	import { PaginatedTable, UserName } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'role', label: 'Role', hideOnMobile: true },
	];

	const fetchCommand = (start, num) => UserService.getUsers(null, null, num, start);

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
	<PaginatedTable {columns} {fetchCommand} onedit={handleEdit} {cellContent} />
	<div class="mt-6 flex justify-center">
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			onclick={handleCreate}
			type="button"
			>Create Contact
		</button>
	</div>
</div>
