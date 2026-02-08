<script>
	import {Form} from '$lib';

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
		{error}
		legend="Create vacancy"
		{loading}
		{oncancel}
		{onsubmit}
		submitLabel="Create Vacancy"
	>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="startTime">
				Start Time
			</label>
			<input
				bind:value={startTime}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				id="startTime"
				name="startTime"
				required
				type="datetime-local"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="endTime">
				End Time
			</label>
			<input
				bind:value={endTime}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				id="endTime"
				name="endTime"
				required
				type="datetime-local"
			/>
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
				<option value="">Select a location</option>
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
				<option value="">Select an employee</option>
				{#each employees as employee}
					<option value={employee.id}>{employee.name || employee.email}</option>
				{/each}
			</select>
		</div>
	</Form>
</div>
