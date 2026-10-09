<script>
	import { m } from '#lib/paraglide/messages.js';
	import { choiceLabel, radio, input, label } from '#lib/ui.js';

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

<form onsubmit={handleSubmit}>
	<fieldset>
		<legend class="mb-4 text-sm font-semibold text-gray-900">{m.filterContacts()}</legend>

		<div class="space-y-4">
			<div>
				<label class={label} for="filter-name">{m.labelName()}</label>
				<input
					bind:value={name}
					class={input}
					id="filter-name"
					name="filter-name"
					type="text"
					placeholder={m.searchByName()}
				/>
			</div>

			<div>
				<span class={label} id="filter-roles-label">{m.labelRole()}</span>
				<div class="space-y-2" role="radiogroup" aria-labelledby="filter-roles-label">
					<div class="flex items-center gap-2">
						<input
							checked={role === ''}
							onchange={() => onrolechange('')}
							class={radio}
							id="filter-role-all"
							name="filter-role"
							type="radio"
							value=""
						/>
						<label class={choiceLabel} for="filter-role-all">{m.all()}</label>
					</div>
					{#each ROLES as roleOption (roleOption.value)}
						<div class="flex items-center gap-2">
							<input
								checked={role === roleOption.value}
								onchange={() => onrolechange(roleOption.value)}
								class={radio}
								id={`filter-role-${roleOption.value}`}
								name="filter-role"
								type="radio"
								value={roleOption.value}
							/>
							<label class={choiceLabel} for={`filter-role-${roleOption.value}`}>{roleOption.label()}</label>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</fieldset>
</form>
