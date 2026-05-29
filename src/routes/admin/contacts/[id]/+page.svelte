<script>
	import { Form, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { useContactData } from './contactData.svelte.js';

	let id = $derived($page.params.id);
	let isEdit = $derived(id !== 'new');

	const contact = useContactData();

	let email = $state('');
	let name = $state('');
	let phone = $state('');
	let role = $state('Customer');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	onMount(async () => {
		if (!isEdit) return;
		loadingData = true;
		try {
			const existing = await contact.getContact(id);
			email = existing.email;
			name = existing.name || '';
			phone = existing.phone || '';
			role = existing.role;
		} catch (err) {
			error = apiErrorMessage(err);
		} finally {
			loadingData = false;
		}
	});

	async function handleSubmit() {
		error = null;
		loading = true;
		try {
			await contact.saveContact({
				id,
				isEdit,
				payload: isEdit ? { name, phone } : { email },
			});
			await goto(resolve('/admin/contacts'));
		} catch (err) {
			error = apiErrorMessage(err);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto(resolve('/admin/contacts'));
	}
</script>

<div>
	{#if loadingData}
		<div role="status" aria-live="polite">
			<p>Loading...</p>
		</div>
	{:else}
		<div class="max-w-2xl">
			<Form
				legend={isEdit ? 'Edit contact' : 'Create contact'}
				{error}
				{loading}
				submitLabel={isEdit ? 'Update' : 'Create'}
				onsubmit={handleSubmit}
				oncancel={handleCancel}
			>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
					<input
						id="email"
						name="email"
						type="email"
						required
						disabled={isEdit}
						bind:value={email}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
						title="Email cannot be changed"
					/>
				</div>

				{#if isEdit}
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1"> Name </label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={name}
							class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1"> Phone </label>
						<input
							id="phone"
							name="phone"
							type="tel"
							bind:value={phone}
							class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>

					<div>
						<label for="role" class="block text-sm font-medium text-gray-700 mb-1"> Role </label>
						<input
							id="role"
							name="role"
							type="text"
							disabled
							bind:value={role}
							class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed sm:text-sm"
							title="Role cannot be changed via this form"
						/>
					</div>
				{/if}
			</Form>
		</div>
	{/if}
</div>
