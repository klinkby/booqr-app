<script>
	import { m } from '#lib/paraglide/messages.js';
	import { buttonDanger, buttonPrimary, buttonSecondary } from '#lib/ui.js';

	let {
		legend,
		error = null,
		loading = false,
		card = false,
		submitLabel = m.submit(),
		submitDisabled = false,
		deleteLabel = undefined,
		onsubmit,
		oncancel = undefined,
		ondelete = undefined,
		children,
	} = $props();

	// Card mode is the design.md form card; the plain mode is kept for forms not yet migrated.
	const CARD = {
		form: 'overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5',
		alert: 'bg-red-50 px-4 py-4 text-sm text-red-800 sm:px-6',
		fieldset: 'min-w-0 divide-y divide-gray-900/10',
		actions: 'flex items-center justify-end gap-3 border-t border-gray-900/10 bg-gray-50 px-4 py-4 sm:px-6',
		button: 'flex-1 sm:flex-none',
	};
	const PLAIN = {
		form: '',
		alert: 'mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800',
		fieldset: 'space-y-4',
		actions: 'mt-6 flex items-center justify-end gap-3',
		button: '',
	};
	let cls = $derived(card ? CARD : PLAIN);

	const trimTypes = new Set(['text', 'tel', 'email', 'search', 'url']);

	function handleSubmit(event) {
		event.preventDefault();
		for (const el of event.target.elements) {
			if ((el.tagName === 'INPUT' && trimTypes.has(el.type)) || el.tagName === 'TEXTAREA') {
				el.value = el.value.trim();
				el.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}
		if (!event.target.checkValidity()) {
			event.target.reportValidity();
			return;
		}
		onsubmit(event);
	}

	$effect(() => {
		if (!oncancel) return;

		function handleEscape(e) {
			if (e.key === 'Escape' && !loading) {
				e.preventDefault();
				oncancel();
			}
		}

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	});
</script>

<form novalidate onsubmit={handleSubmit} class={cls.form}>
	<div aria-live="polite" class={cls.alert} class:hidden={!error} role="alert">
		<p>{error}</p>
	</div>

	<fieldset class={cls.fieldset} disabled={loading}>
		<legend class="sr-only">{legend}</legend>
		{@render children()}
	</fieldset>

	<div class={cls.actions}>
		{#if ondelete && deleteLabel}
			<button type="button" disabled={loading} class="{buttonDanger} mr-auto" onclick={ondelete}>{deleteLabel}</button>
		{/if}
		{#if oncancel}
			<button type="button" disabled={loading} class="{buttonSecondary} {cls.button}" onclick={oncancel}
				>{m.cancel()}</button
			>
		{/if}
		<button
			class="{buttonPrimary} {cls.button}"
			class:opacity-50={submitDisabled && !loading}
			class:cursor-not-allowed={submitDisabled && !loading}
			disabled={loading}
			type="submit">{loading ? m.pleaseWait() : submitLabel}</button
		>
	</div>
</form>
