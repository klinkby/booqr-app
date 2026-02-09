<script>
	let {
		legend,
		error = null,
		loading = false,
		submitLabel = 'Submit',
		onsubmit,
		oncancel = undefined,
		children
	} = $props();

	function handleSubmit(event) {
		event.preventDefault();
		onsubmit(event);
	}

	function handleKeydown(e) {
		if (e.key === 'Escape' && oncancel) oncancel();
		if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !loading) {
			e.preventDefault();
			onsubmit(e);
		}
	}
</script>

<form novalidate onsubmit={handleSubmit} onkeydown={handleKeydown}>
	<div aria-live="polite" class="rounded-md bg-red-50 p-4 mb-4" class:hidden={!error} role="alert">
		<p class="text-sm text-red-800">{error}</p>
	</div>

	<fieldset class="space-y-4" disabled={loading}>
		<legend class="sr-only">{legend}</legend>
		{@render children()}
	</fieldset>

	<div class="flex items-center justify-end gap-3 mt-6">
		{#if oncancel}
			<button
				type="button"
				disabled={loading}
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={oncancel}
			>Cancel
			</button>
		{/if}
		<button
			class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={loading}
			type="submit"
		>{loading ? 'Please wait\u2026' : submitLabel}</button>
	</div>
</form>
