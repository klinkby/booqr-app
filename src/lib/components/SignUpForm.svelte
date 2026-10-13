<script>
	import { ContactFields, Form, RequiredInput } from '#lib';
	import { m } from '#lib/paraglide/messages.js';
	import { MARKETING_URL } from '#lib/tenant.svelte.js';
	import { cardSection, checkbox, choiceLabel, label, link } from '#lib/ui.js';

	let {
		email = $bindable(''),
		name = $bindable(''),
		phone = $bindable(''),
		error = null,
		loading = false,
		onsubmit,
	} = $props();
	let acceptTerms = $state(false);
</script>

<Form card legend={m.signUp()} {error} {loading} {onsubmit} submitLabel={m.signUp()}>
	<div class="{cardSection} space-y-4">
		<ContactFields bind:name bind:phone>
			<div>
				<label for="signupEmail" class={label}>{m.labelEmailAddress()}</label>
				<RequiredInput
					id="signupEmail"
					name="email"
					type="email"
					autocomplete="email"
					placeholder={m.labelEmailAddress()}
					bind:value={email}
				/>
			</div>
		</ContactFields>
		<div class="flex items-start gap-3">
			<input
				id="acceptTerms"
				name="acceptTerms"
				type="checkbox"
				required
				bind:checked={acceptTerms}
				class="{checkbox} mt-0.5"
			/>
			<label for="acceptTerms" class={choiceLabel}>
				{m.iAcceptThe()}
				<a href="{MARKETING_URL}/terms" target="_blank" rel="noopener" class={link}>
					{m.termsAndConditionsLink()}
				</a>.
			</label>
		</div>
	</div>
</Form>
