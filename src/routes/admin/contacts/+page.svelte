<script>
	import {UserService} from '$lib/api';
	import {PaginatedTable} from '$lib';
	import {goto} from '$app/navigation';

	const columns = [
		{key: 'name', label: 'Name'},
		{key: 'email', label: 'Email'},
		{key: 'role', label: 'Role'}
	];
	const fetchCommand = UserService.getUsers;

	function handleEdit(row) {
		goto(`/admin/contacts/${row.id}`);
	}

	function handleCreate() {
		goto('/admin/contacts/new');
	}
</script>

<div>
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-3xl font-bold">Contacts</h1>
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			onclick={handleCreate}
			type="button"
		>Create Contact
		</button>
	</div>
	<PaginatedTable {columns} {fetchCommand} onedit={handleEdit}/>
</div>
