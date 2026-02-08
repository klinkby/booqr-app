<script>
	import {ServiceService} from '$lib/api';
	import {Form, invokeApi} from '$lib';
	import {goto} from '$app/navigation';
	import {onMount} from 'svelte';
	import {page} from '$app/stores';

	let id = $derived($page.params.id);
	let isEdit = $derived(id !== 'new');

	let name = $state('');
	let duration = $state('');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	async function loadService() {
		if (!isEdit) return;

		loadingData = true;
		try {
			const service = await invokeApi(() => ServiceService.getServiceById(id));
			name = service.name;
			duration = service.duration;
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to load service:', err);
			}
			error = 'Failed to load service. Please try again.';
		} finally {
			loadingData = false;
		}
	}

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			if (isEdit) {
				await invokeApi(() => ServiceService.updateService(id, {name, duration}));
			} else {
				await invokeApi(() => ServiceService.addService({name, duration}));
			}
			await goto('/admin/services');
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to save service:', err);
			}
			error = err.message || 'Failed to save service. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/admin/services');
	}

	onMount(() => {
		loadService();
	});
</script>

<div>
	<h1 class="text-3xl font-bold mb-6">{isEdit ? 'Edit Service' : 'Create Service'}</h1>

	{#if loadingData}
		<div role="status" aria-live="polite">
			<p>Loading...</p>
		</div>
	{:else}
		<div class="max-w-2xl">
			<Form
				legend={isEdit ? 'Edit service' : 'Create service'}
				{error}
				{loading}
				submitLabel={isEdit ? 'Update' : 'Create'}
				onsubmit={handleSubmit}
				oncancel={handleCancel}
			>
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
						Name
					</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						bind:value={name}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="duration" class="block text-sm font-medium text-gray-700 mb-1">
						Duration
					</label>
					<input
						id="duration"
						name="duration"
						type="text"
						required
						bind:value={duration}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="e.g., 01:00:00"
					/>
				</div>
			</Form>
		</div>
	{/if}
</div>
