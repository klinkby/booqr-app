<script>
	import { m } from '$lib/paraglide/messages.js';

	const ROLES = [
		{ value: 'Customer', label: () => m.customer() },
		{ value: 'Employee', label: () => m.employee() },
	];

	let { name = $bindable(''), role = '', onrolechange, onsubmit } = $props();

	function handleSubmit(event) {
		event.preventDefault();
		onsubmit?.();
	}
</script>

<form class="p-4 bg-white border border-gray-200 rounded-lg shadow-lg w-72" onsubmit={handleSubmit}>
	<fieldset>
		<legend class="text-sm font-semibold text-gray-900 mb-3">{m.filterContacts()}</legend>

		<div class="mb-4">
			<label class="block text-sm font-medium text-gray-700 mb-1" for="filter-name"> {m.labelName()} </label>
			<input
				bind:value={name}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				id="filter-name"
				name="filter-name"
				type="text"
				placeholder={m.searchByName()}
			/>
		</div>

		<div>
			<span class="block text-sm font-medium text-gray-700 mb-1" id="filter-roles-label">{m.labelRole()}</span>
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
					<label class="ml-2 text-sm text-gray-700" for="filter-role-all">{m.all()}</label>
				</div>
				{#each ROLES as roleOption (roleOption.value)}
					<div class="flex items-center">
						<input
							checked={role === roleOption.value}
							onchange={() => onrolechange(roleOption.value)}
							class="size-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
							id={`filter-role-${roleOption.value}`}
							name="filter-role"
							type="radio"
							value={roleOption.value}
						/>
						<label class="ml-2 text-sm text-gray-700" for={`filter-role-${roleOption.value}`}
							>{roleOption.label()}</label
						>
					</div>
				{/each}
			</div>
		</div>
	</fieldset>
</form>
