<script>
	import {LocationService} from '$lib/api';
	import {Form, invokeApi} from '$lib';
	import {goto} from '$app/navigation';
	import {onMount} from 'svelte';
	import {page} from '$app/stores';

	let id = $derived($page.params.id);
	let isEdit = $derived(id !== 'new');

	let name = $state('');
	let address1 = $state('');
	let address2 = $state('');
	let zip = $state('');
	let city = $state('');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	async function loadLocation() {
		if (!isEdit) return;

		loadingData = true;
		try {
			const location = await invokeApi(() => LocationService.getLocationById(id));
			name = location.name;
			address1 = location.address1 || '';
			address2 = location.address2 || '';
			zip = location.zip || '';
			city = location.city || '';
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to load location:', err);
			}
			error = 'Failed to load location. Please try again.';
		} finally {
			loadingData = false;
		}
	}

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			const payload = {name, address1, address2, zip, city};
			if (isEdit) {
				await invokeApi(() => LocationService.updateLocation(id, payload));
			} else {
				await invokeApi(() => LocationService.addLocation(payload));
			}
			await goto('/admin/locations');
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to save location:', err);
			}
			error = err.message || 'Failed to save location. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/admin/locations');
	}

	onMount(() => {
		loadLocation();
	});
</script>

<div>
	<h1 class="text-3xl font-bold mb-6">{isEdit ? 'Edit Location' : 'Create Location'}</h1>

	{#if loadingData}
		<div role="status" aria-live="polite">
			<p>Loading...</p>
		</div>
	{:else}
		<div class="max-w-2xl">
			<Form
				legend={isEdit ? 'Edit location' : 'Create location'}
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
					<label for="address1" class="block text-sm font-medium text-gray-700 mb-1">
						Address 1
					</label>
					<input
						id="address1"
						name="address1"
						type="text"
						bind:value={address1}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="address2" class="block text-sm font-medium text-gray-700 mb-1">
						Address 2
					</label>
					<input
						id="address2"
						name="address2"
						type="text"
						bind:value={address2}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="zip" class="block text-sm font-medium text-gray-700 mb-1">
						Zip Code
					</label>
					<input
						id="zip"
						name="zip"
						type="text"
						bind:value={zip}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="city" class="block text-sm font-medium text-gray-700 mb-1">
						City
					</label>
					<input
						id="city"
						name="city"
						type="text"
						bind:value={city}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>
			</Form>
		</div>
	{/if}
</div>
