<script>
	import { m } from '#lib/paraglide/messages.js';
	import { buttonPrimary, buttonSecondary, card, cardActions, cardSection, sectionHeading } from '#lib/ui.js';

	let { open, title, message, confirmLabel, loading = false, onconfirm, oncancel } = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const messageId = `${uid}-message`;

	let dialog = $state(null);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	// Escape closes the dialog only; stop it reaching Form's document-level listener, which navigates away.
	function handleKeydown(event) {
		if (event.key === 'Escape') event.stopPropagation();
	}

	function handleCancelEvent(event) {
		event.preventDefault();
		if (!loading) oncancel();
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby={titleId}
	aria-describedby={messageId}
	class="{card} m-auto w-full max-w-md p-0 backdrop:bg-gray-900/50"
	oncancel={handleCancelEvent}
	onkeydown={handleKeydown}
>
	<div class={cardSection}>
		<h2 id={titleId} class={sectionHeading}>{title}</h2>
		<p id={messageId} class="mt-2 text-sm text-gray-700">{message}</p>
	</div>
	<div class={cardActions}>
		<button type="button" class={buttonSecondary} disabled={loading} onclick={oncancel}>{m.cancel()}</button>
		<button type="button" class={buttonPrimary} disabled={loading} onclick={onconfirm}
			>{loading ? m.pleaseWait() : confirmLabel}</button
		>
	</div>
</dialog>
