<script>
	import { m } from '#lib/paraglide/messages.js';
	import { alert, buttonSecondary, card, cardActions, cardSection, dialogScroll, sectionHeading } from '#lib/ui.js';
	import ErrorMessage from './ErrorMessage.svelte';

	// Read-only native <dialog> showing a block of plain text (e.g. a customer's booking notes).
	// Presentational: the parent owns `open` and loads `message`.
	let { open, title, message = '', loading = false, error = null, onclose } = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const messageId = `${uid}-message`;

	let dialog = $state(null);
	let closeButton = $state(null);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			// Start on Close, not on the scrollable text that showModal() may pick; Shift+Tab reaches the text.
			closeButton?.focus();
		} else if (!open && dialog.open) dialog.close();
	});

	// Escape closes the dialog only; stop it reaching Form's document-level listener, which navigates away.
	function handleKeydown(event) {
		if (event.key === 'Escape') event.stopPropagation();
	}

	function handleCancelEvent(event) {
		event.preventDefault();
		onclose();
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
	<!-- The dialog is capped at the viewport height; heading and Close stay put and only the text scrolls.
	     `open:flex` (not `flex`) so the closed dialog keeps its UA `display: none`. -->
	<div class="{cardSection} flex min-h-0 flex-col">
		<h2 id={titleId} class={sectionHeading}>{title}</h2>
		<div id={messageId} class="mt-2 flex min-h-0 flex-col text-sm text-gray-700" aria-live="polite">
			{#if loading}
				<p role="status" class="text-gray-500">{m.loading()}</p>
			{:else if error}
				<p role="alert" class={alert}><ErrorMessage {error} /></p>
			{:else}
				<p class="{dialogScroll} break-words whitespace-pre-wrap">{message}</p>
			{/if}
		</div>
	</div>
	<div class="{cardActions} shrink-0">
		<button bind:this={closeButton} type="button" class={buttonSecondary} onclick={onclose}>{m.close()}</button>
	</div>
</dialog>
