<script>
	import {UserService} from '$lib/api';
	import {Form, invokeApi} from '$lib';
	import {goto} from '$app/navigation';
	import {onMount} from 'svelte';
	import {page} from '$app/stores';

	let id = $derived($page.params.id);
	let isEdit = $derived(id !== 'new');

	let email = $state('');
	let name = $state('');
	let phone = $state('');
	let role = $state('Customer');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	async function loadUser() {
		if (!isEdit) return;

		loadingData = true;
		try {
			const user = await invokeApi(() => UserService.getUserById(id));
			email = user.email;
			name = user.name || '';
			phone = user.phone || '';
			role = user.role;
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to load user:', err);
			}
			error = 'Failed to load user. Please try again.';
		} finally {
			loadingData = false;
		}
	}

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			if (isEdit) {
				await invokeApi(() => UserService.updateUser(id, {name, phone}));
			} else {
				await invokeApi(() => UserService.addUser({email}));
			}
			await goto('/admin/contacts');
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to save user:', err);
			}
			error = err.message || 'Failed to save user. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/admin/contacts');
	}

	onMount(() => {
		loadUser();
	});
</script>

<div>
	<h1 class="text-3xl font-bold mb-6">{isEdit ? 'Edit Contact' : 'Create Contact'}</h1>

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
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						Email
					</label>
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
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={name}
							class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
							Phone
						</label>
						<input
							id="phone"
							name="phone"
							type="tel"
							bind:value={phone}
							class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>

					<div>
						<label for="role" class="block text-sm font-medium text-gray-700 mb-1">
							Role
						</label>
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
