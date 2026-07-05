<script>
	const ROLES = ['Customer', 'Employee'];

	let { name = $bindable(''), role = '', onrolechange, onsubmit } = $props();

	function handleSubmit(event) {
		event.preventDefault();
		onsubmit?.();
	}
</script>

<form class="p-4 bg-white border border-gray-200 rounded-lg shadow-lg w-72" onsubmit={handleSubmit}>
	<fieldset>
		<legend class="text-sm font-semibold text-gray-900 mb-3">Filter Contacts</legend>

		<div class="mb-4">
			<label class="block text-sm font-medium text-gray-700 mb-1" for="filter-name"> Name </label>
			<input
				bind:value={name}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				id="filter-name"
				name="filter-name"
				type="text"
				placeholder="Search by name"
			/>
		</div>

		<div>
			<span class="block text-sm font-medium text-gray-700 mb-1" id="filter-roles-label">Role</span>
			<div class="space-y-2" role="radiogroup" aria-labelledby="filter-roles-label">
				<div class="flex items-center">
					<input
						checked={role === ''}
						onchange={() => onrolechange('')}
						class="size-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
						id="filter-role-all"
						name="filter-role"
						type="radio"
						value=""
					/>
					<label class="ml-2 text-sm text-gray-700" for="filter-role-all">All</label>
				</div>
				{#each ROLES as roleOption (roleOption)}
					<div class="flex items-center">
						<input
							checked={role === roleOption}
							onchange={() => onrolechange(roleOption)}
							class="size-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
							id={`filter-role-${roleOption}`}
							name="filter-role"
							type="radio"
							value={roleOption}
						/>
						<label class="ml-2 text-sm text-gray-700" for={`filter-role-${roleOption}`}>{roleOption}</label>
					</div>
				{/each}
			</div>
		</div>
	</fieldset>
</form>
