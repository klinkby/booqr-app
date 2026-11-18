<script>
	import { m } from '#lib/paraglide/messages.js';
	import {
		buttonDanger,
		buttonPrimary,
		buttonSecondary,
		card,
		cardActions,
		cardSection,
		dialogScroll,
		sectionHeading,
	} from '#lib/ui.js';

	let {
		open,
		title,
		message,
		confirmLabel,
		loading = false,
		danger = false,
		onconfirm,
		oncancel,
		children = undefined,
	} = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const messageId = `${uid}-message`;

	let dialog = $state(null);
	let cancelButton = $state(null);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			// Start on Cancel (the safe choice), not on a scrollable body that showModal() may pick.
			cancelButton?.focus();
		} else if (!open && dialog.open) dialog.close();
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
	class="{card} m-auto max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col p-0 backdrop:bg-gray-900/50 open:flex"
	oncancel={handleCancelEvent}
	onkeydown={handleKeydown}
>
	<!-- Capped at the viewport height: heading, message and buttons stay put and only `children` scrolls.
	     `open:flex` (not `flex`) so the closed dialog keeps its UA `display: none`. -->
	<div class="{cardSection} flex min-h-0 flex-col">
		<h2 id={titleId} class={sectionHeading}>{title}</h2>
		<p id={messageId} class="mt-2 text-sm text-gray-700">{message}</p>
		{#if children}
			<div class="mt-4 {dialogScroll}">{@render children()}</div>
		{/if}
	</div>
	<div class="{cardActions} shrink-0">
		<button bind:this={cancelButton} type="button" class={buttonSecondary} disabled={loading} onclick={oncancel}
			>{m.cancel()}</button
		>
		<button type="button" class={danger ? buttonDanger : buttonPrimary} disabled={loading} onclick={onconfirm}
			>{loading ? m.pleaseWait() : confirmLabel}</button
		>
	</div>
</dialog>
