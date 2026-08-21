<script>
	import { Form, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { useLocationData } from './locationData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

	let id = $derived($page.params.id);
	let isEdit = $derived(id !== 'new');

	const location = useLocationData();

	let name = $state('');
	let address1 = $state('');
	let address2 = $state('');
	let zip = $state('');
	let city = $state('');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	onMount(async () => {
		if (!isEdit) return;
		loadingData = true;
		try {
			const existing = await location.getLocation(id);
			name = existing.name;
			address1 = existing.address1 || '';
			address2 = existing.address2 || '';
			zip = existing.zip || '';
			city = existing.city || '';
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
			await location.saveLocation({ id, isEdit, payload: { name, address1, address2, zip, city } });
			await goto(resolve('/admin/locations'));
		} catch (err) {
			error = apiErrorMessage(err);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto(resolve('/admin/locations'));
	}
</script>

<div>
	{#if loadingData}
		<div role="status" aria-live="polite">
			<p>{m.loading()}</p>
		</div>
	{:else}
		<div class="max-w-2xl">
			<Form
				legend={isEdit ? m.legendEditLocation() : m.legendCreateLocation()}
				{error}
				{loading}
				submitLabel={isEdit ? m.update() : m.create()}
				onsubmit={handleSubmit}
				oncancel={handleCancel}
			>
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelName()} </label>
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
					<label for="address1" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelAddress1()} </label>
					<input
						id="address1"
						name="address1"
						type="text"
						bind:value={address1}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="address2" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelAddress2()} </label>
					<input
						id="address2"
						name="address2"
						type="text"
						bind:value={address2}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="zip" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelZipCode()} </label>
					<input
						id="zip"
						name="zip"
						type="text"
						bind:value={zip}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="city" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelCity()} </label>
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
