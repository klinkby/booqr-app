<script>
	import { Form, LimitedTextarea, RequiredInput, apiErrorMessage } from '#lib';
	import { cardSection, checkbox, choiceLabel, groupHeading, label } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { useServiceData } from './serviceData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	let id = $derived(page.params.id);
	let isEdit = $derived(id !== 'new');

	const service = useServiceData();

	let name = $state('');
	let duration = $state('');
	let description = $state('');
	let selectedEmployeeIds = $state([]);
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	function isSelected(empId) {
		return selectedEmployeeIds.includes(String(empId));
	}

	function toggleEmployee(empId) {
		const strId = String(empId);
		if (isSelected(empId)) {
			selectedEmployeeIds = selectedEmployeeIds.filter((x) => x !== strId);
		} else {
			selectedEmployeeIds = [...selectedEmployeeIds, strId];
		}
	}

	onMount(async () => {
		if (!isEdit) return;
		loadingData = true;
		try {
			const existing = await service.getService(id);
			name = existing.name;
			duration = existing.duration;
			description = existing.description || '';
			selectedEmployeeIds = (existing.employees || []).map(String);
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
			await service.saveService({
				id,
				isEdit,
				payload: { name, duration, description: description || null, employees: selectedEmployeeIds },
			});
			await goto(resolve('admin/services'));
		} catch (err) {
			error = apiErrorMessage(err);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto(resolve('admin/services'));
	}
</script>

<div>
	{#if service.isLoading || loadingData}
		<div role="status" aria-live="polite">
			<p class="text-sm text-gray-500">{m.loading()}</p>
		</div>
	{:else}
		<Form
			card
			legend={isEdit ? m.legendEditService() : m.legendCreateService()}
			{error}
			{loading}
			submitLabel={isEdit ? m.update() : m.create()}
			onsubmit={handleSubmit}
			oncancel={handleCancel}
		>
			<div class={cardSection}>
				<div class="grid grid-cols-6 gap-x-4 gap-y-4">
					<div class="col-span-6 sm:col-span-4">
						<label for="name" class={label}>{m.labelName()}</label>
						<RequiredInput id="name" name="name" type="text" autocomplete="off" bind:value={name} />
					</div>

					<div class="col-span-6 sm:col-span-2">
						<label for="duration" class={label}>{m.labelDuration()}</label>
						<RequiredInput
							id="duration"
							name="duration"
							type="text"
							autocomplete="off"
							placeholder={m.durationPlaceholder()}
							bind:value={duration}
						/>
					</div>
				</div>

				<div class="mt-4">
					<LimitedTextarea id="description" label={m.labelDescription()} bind:value={description} />
				</div>
			</div>

			<div class={cardSection}>
				<fieldset>
					<legend class={groupHeading}>{m.employees()}</legend>
					<div class="mt-4 space-y-2">
						{#each service.employees as emp (emp.id)}
							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									id="emp-{emp.id}"
									checked={isSelected(emp.id)}
									onchange={() => toggleEmployee(emp.id)}
									class={checkbox}
								/>
								<label for="emp-{emp.id}" class={choiceLabel}>{emp.name || emp.email}</label>
							</div>
						{:else}
							<p class="text-sm text-gray-500">{m.noEmployeesFound()}</p>
						{/each}
					</div>
				</fieldset>
			</div>
		</Form>
	{/if}
</div>
