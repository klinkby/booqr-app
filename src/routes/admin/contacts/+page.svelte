<script>
	import { PaginatedTable, UserName } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useContactsData } from './contactsData.svelte.js';
	import ContactsFilterForm from './ContactsFilterForm.svelte';
	import { m } from '$lib/paraglide/messages.js';

	const columns = [
		{ key: 'name', label: m.labelName() },
		{ key: 'role', label: m.labelRole(), hideOnMobile: true },
	];

	let showFilters = $state(false);
	let nameFilter = $state('');
	let debouncedNameFilter = $state('');
	let selectedRole = $state('');

	$effect(() => {
		const name = nameFilter;
		const timeoutId = setTimeout(() => {
			debouncedNameFilter = name;
		}, 500);
		return () => clearTimeout(timeoutId);
	});

	const contacts = useContactsData(() => ({
		name: debouncedNameFilter,
		roles: selectedRole ? [selectedRole] : [],
	}));

	function handleEdit(row) {
		goto(resolve(`/admin/contacts/${row.id}`));
	}

	function handleCreate() {
		goto(resolve('/admin/contacts/new'));
	}

	function toggleFilters() {
		showFilters = !showFilters;
	}

	function setRole(role) {
		selectedRole = role;
	}
</script>

<div>
	{#snippet cellContent(column, row)}
		{#if column.key === 'name'}
			<UserName id={row.id} name={row.name} email={row.email} />
		{:else}
			{row[column.key]}
		{/if}
	{/snippet}
	<div class="mb-4 flex justify-between items-center">
		<button
			class="px-4 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
			onclick={handleCreate}
			type="button"
			>{m.createContact()}
		</button>
		<div class="relative">
			<button
				aria-controls="contacts-filter-panel"
				aria-expanded={showFilters}
				aria-label={m.toggleContactFilters()}
				class="p-2 bg-transparent border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
				onclick={toggleFilters}
				type="button"
			>
				<svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path
						d="M3.75 5.25h16.5l-6.15 7.38v5.62l-4.2 2.1v-7.72L3.75 5.25Z"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if showFilters}
				<div class="absolute right-0 top-full mt-2 z-10" id="contacts-filter-panel">
					<ContactsFilterForm
						bind:name={nameFilter}
						role={selectedRole}
						onrolechange={setRole}
						onsubmit={() => {
							debouncedNameFilter = nameFilter;
							showFilters = false;
						}}
					/>
				</div>
			{/if}
		</div>
	</div>
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
</div>
