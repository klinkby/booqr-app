<!--
  Presentational language toggle link.
  Shows the alternate language name in that language's own text,
  so users can always find it regardless of the current language.
-->
<script>
	let { current, alternate, ontoggle } = $props();

	const labels = { da: 'Dansk', en: 'English' };
</script>

<button
	type="button"
	class="inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900"
	lang={alternate}
	aria-label={current === 'da' ? 'Switch to English' : 'Skift til dansk'}
	onclick={ontoggle}
>
	<svg
		class="size-3.5"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		viewBox="0 0 24 24"
		aria-hidden="true"
		><circle cx="12" cy="12" r="9" /><path
			d="M3 12h18M12 3c2.5 2.7 3.75 5.7 3.75 9S14.5 18.3 12 21M12 3C9.5 5.7 8.25 8.7 8.25 12S9.5 18.3 12 21"
		/></svg
	>
	{labels[alternate]}
</button>
