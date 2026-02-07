<script>
	import { UserService } from '$lib/api';
	import { PaginatedTable } from '$lib';

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email' },
		{ key: 'role', label: 'Role' }
	];
	const fetchCommand = UserService.getUsers;
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6">Contacts</h1>
	<PaginatedTable {columns} {fetchCommand} />
</div>