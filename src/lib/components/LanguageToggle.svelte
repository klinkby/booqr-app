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
	class="text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
	lang={alternate}
	aria-label={current === 'da' ? 'Switch to English' : 'Skift til dansk'}
	onclick={ontoggle}
>
	{labels[alternate]}
</button>
