<script>
	import { Form } from '#lib';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cardSection, input, label, sectionHeading } from '#lib/ui.js';

	let {
		mode = 'create', // 'create' or 'view'
		date = '',
		startTime = $bindable(''),
		endTime = $bindable(''),
		locationId = $bindable(''),
		employeeId = $bindable(''),
		locations = [],
		employees = [],
		error = null,
		loading = false,
		onsubmit,
		oncancel,
		ondelete = undefined,
	} = $props();

	const isReadonly = $derived(mode === 'view');

	const timeError = $derived(startTime && endTime && endTime <= startTime ? m.endTimeAfterStart() : null);

	const formattedDate = $derived(
		date
			? new Date(date + 'T00:00').toLocaleDateString(getLocale(), {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				})
			: '',
	);
</script>

<div class="sticky top-20">
	<h2 class="{sectionHeading} mb-4">{isReadonly ? m.vacancyDetails() : m.createNewVacancy()}</h2>

	<Form
		card
		error={timeError || error}
		legend={isReadonly ? m.legendViewVacancy() : m.legendCreateVacancy()}
		{loading}
		{oncancel}
		onsubmit={(e) => {
			if (!isReadonly && !timeError) {
				onsubmit(e);
			}
		}}
		submitLabel={isReadonly ? null : m.createVacancy()}
		deleteLabel={isReadonly ? m.delete() : undefined}
		{ondelete}
	>
		<div class="{cardSection} space-y-4">
			{#if formattedDate}
				<p class="text-sm text-gray-500">{formattedDate}</p>
			{/if}

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class={label} for="startTime">{m.labelStart()}</label>
					<input
						bind:value={startTime}
						class={input}
						id="startTime"
						name="startTime"
						required
						step="300"
						type="time"
						disabled={isReadonly}
					/>
				</div>

				<div>
					<label class={label} for="endTime">{m.labelEnd()}</label>
					<input
						bind:value={endTime}
						class={input}
						id="endTime"
						name="endTime"
						required
						step="300"
						type="time"
						disabled={isReadonly}
					/>
				</div>
			</div>

			<div>
				<label class={label} for="locationId">{m.labelLocation()}</label>
				<select bind:value={locationId} class={input} id="locationId" name="locationId" required disabled={isReadonly}>
					<option value="" disabled selected>{m.selectALocation()}</option>
					{#each locations as location (location.id)}
						<option value={String(location.id)}>{location.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class={label} for="employeeId">{m.labelEmployee()}</label>
				<select bind:value={employeeId} class={input} id="employeeId" name="employeeId" required disabled={isReadonly}>
					<option value="" disabled selected>{m.selectAnEmployee()}</option>
					{#each employees as employee (employee.id)}
						<option value={String(employee.id)}>{employee.name || employee.email}</option>
					{/each}
				</select>
			</div>
		</div>
	</Form>
</div>
