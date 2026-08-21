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
	class="underline hover:text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
	lang={alternate}
	aria-label={current === 'da' ? 'Switch to English' : 'Skift til dansk'}
	onclick={ontoggle}
>
	{labels[alternate]}
</button>
