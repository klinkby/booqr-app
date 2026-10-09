<script>
	import { m } from '#lib/paraglide/messages.js';
	import { buttonPrimary, card, cardActions, cardSection, label, cardAlert, cardSuccess } from '#lib/ui.js';
	import RequiredInput from './RequiredInput.svelte';

	let { email = $bindable(''), error = null, message = null, loading = false, onsubmit } = $props();
</script>

<div class={card}>
	<!-- Success message -->
	<div role="status" aria-live="polite" class={cardSuccess} class:hidden={!message}>
		<p>{message}</p>
	</div>

	<!-- Error message -->
	<div role="alert" aria-live="polite" class={cardAlert} class:hidden={!error}>
		<p>{error}</p>
	</div>

	<div class={cardSection}>
		<label for="reset-email" class={label}>{m.labelEmail()}</label>
		<RequiredInput id="reset-email" name="email" type="email" autocomplete="email" bind:value={email} />
	</div>

	<div class={cardActions}>
		<button type="button" disabled={loading} onclick={onsubmit} class="{buttonPrimary} flex-1 sm:flex-none">
			{loading ? m.pleaseWait() : m.requestPasswordReset()}
		</button>
	</div>
</div>
