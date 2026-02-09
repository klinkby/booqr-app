<script>
	import {Form} from '$lib';

	let {
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
		oncancel
	} = $props();

	const timeError = $derived(
		startTime && endTime && endTime <= startTime ? 'End time must be after start time' : null
	);

	const formattedDate = $derived(
		date
			? new Date(date + 'T00:00').toLocaleDateString(undefined, {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: ''
	);
</script>

<div class="sticky top-4 p-6 bg-gray-50 border border-gray-200 rounded-lg">
	<h2 class="text-xl font-semibold mb-4">Create New Vacancy</h2>

	<Form
		error={timeError || error}
		legend="Create vacancy"
		{loading}
		{oncancel}
		onsubmit={(e) => { if (!timeError) onsubmit(e); }}
		submitLabel="Create Vacancy"
	>
		{#if formattedDate}
			<p class="text-sm font-medium text-gray-700">{formattedDate}</p>
		{/if}

		<div class="flex gap-4">
			<div class="flex-1">
				<label class="block text-sm font-medium text-gray-700 mb-1" for="startTime">
					Start
				</label>
				<input
					bind:value={startTime}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					id="startTime"
					name="startTime"
					required
					step="300"
					type="time"
				/>
			</div>

			<div class="flex-1">
				<label class="block text-sm font-medium text-gray-700 mb-1" for="endTime">
					End
				</label>
				<input
					bind:value={endTime}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					id="endTime"
					name="endTime"
					required
					step="300"
					type="time"
				/>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="locationId">
				Location
			</label>
			<select
				bind:value={locationId}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				id="locationId"
				name="locationId"
				required
			>
				<option value="" disabled selected>Select a location</option>
				{#each locations as location}
					<option value={location.id}>{location.name}</option>
				{/each}
			</select>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="employeeId">
				Employee
			</label>
			<select
				bind:value={employeeId}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				id="employeeId"
				name="employeeId"
				required
			>
				{#each employees as employee}
					<option value={employee.id}>{employee.name || employee.email}</option>
				{/each}
			</select>
		</div>
	</Form>
</div>
