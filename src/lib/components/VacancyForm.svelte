<script>
	import { Form } from '$lib';

	let {
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
</script>

<div class="sticky top-4 p-6 bg-gray-50 border border-gray-200 rounded-lg">
	<h2 class="text-xl font-semibold mb-4">Create New Vacancy</h2>

	<Form
		legend="Create vacancy"
		{error}
		{loading}
		submitLabel="Create Vacancy"
		{onsubmit}
		{oncancel}
	>
		<div>
			<label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">
				Start Time
			</label>
			<input
				id="startTime"
				name="startTime"
				type="datetime-local"
				required
				bind:value={startTime}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
			/>
		</div>

		<div>
			<label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">
				End Time
			</label>
			<input
				id="endTime"
				name="endTime"
				type="datetime-local"
				required
				bind:value={endTime}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
			/>
		</div>

		<div>
			<label for="locationId" class="block text-sm font-medium text-gray-700 mb-1">
				Location
			</label>
			<select
				id="locationId"
				name="locationId"
				required
				bind:value={locationId}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
			>
				<option value="">Select a location</option>
				{#each locations as location}
					<option value={location.id}>{location.name}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="employeeId" class="block text-sm font-medium text-gray-700 mb-1">
				Employee
			</label>
			<select
				id="employeeId"
				name="employeeId"
				required
				bind:value={employeeId}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
			>
				<option value="">Select an employee</option>
				{#each employees as employee}
					<option value={employee.id}>{employee.name || employee.email}</option>
				{/each}
			</select>
		</div>
	</Form>
</div>
