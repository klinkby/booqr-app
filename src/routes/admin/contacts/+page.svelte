<script>
	import { PaginatedTable } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useContactsData } from './contactsData.svelte.js';
	import ContactsFilterForm from './ContactsFilterForm.svelte';
	import { roleLabel } from './roleLabel.js';
	import { m } from '#lib/paraglide/messages.js';
	import { buttonSecondary, iconButtonSecondary, link } from '#lib/ui.js';

	const columns = [
		{ key: 'name', label: m.labelName() },
		{ key: 'phone', label: m.labelPhone() },
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

	// `tel:` URI: keep only a leading `+` and digits (RFC 3966 global number).
	function telHref(phone) {
		return `tel:${String(phone).replace(/[^\d+]/g, '')}`;
	}

	// Employees book on a contact's behalf by starting the customer wizard with
	// `?customer=`; the confirm step sends it as the booking's `customerId`.
	function bookHref(row) {
		return `${resolve('/')}?customer=${encodeURIComponent(row.id)}`;
	}

	// The name cell describes the row's "Book" link, so screen readers announce
	// which contact it books for (WCAG 2.4.4) without extra UI copy.
	function nameId(row) {
		return `contact-name-${row.id}`;
	}

	function handleEdit(row) {
		goto(resolve(`admin/contacts/${row.id}`));
	}

	function handleCreate() {
		goto(resolve('admin/contacts/new'));
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
			<span id={nameId(row)}>{row.name || row.email}</span>
		{:else if column.key === 'phone'}
			{#if row.phone}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- tel: URI, not app navigation -->
				<a href={telHref(row.phone)} class={link}>{row.phone}</a>
			{/if}
		{:else if column.key === 'role'}
			{roleLabel(row.role)}
		{:else}
			{row[column.key]}
		{/if}
	{/snippet}
	{#snippet rowActions(row)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- bookHref() is built from resolve(); a query string is appended after -->
		<a href={bookHref(row)} class={link} aria-describedby={nameId(row)}>{m.bookNewAppointment()}</a>
	{/snippet}
	<div class="mb-4 flex justify-between items-center">
		<button class={buttonSecondary} onclick={handleCreate} type="button">{m.createContact()}</button>
		<div class="relative">
			<button
				aria-controls="contacts-filter-panel"
				aria-expanded={showFilters}
				aria-label={m.toggleContactFilters()}
				class={iconButtonSecondary}
				onclick={toggleFilters}
				type="button"
			>
				<svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path
						d="M3.75 5.25h16.5l-6.15 7.38v5.62l-4.2 2.1v-7.72L3.75 5.25Z"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					></path>
				</svg>
			</button>
			{#if showFilters}
				<div
					class="absolute right-0 top-full z-10 mt-2 w-72 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-900/5"
					id="contacts-filter-panel"
				>
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
		{rowActions}
		caption={m.titleContacts()}
	/>
</div>
