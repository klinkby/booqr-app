<!--
  Required text input with the design.md asterisk inside its right edge.
  The asterisk is aria-hidden: screen readers announce the `required` attribute.
  Pass the input attributes (id, name, type, autocomplete…) as props; bind:value works.
-->
<script>
	import { input } from '#lib/ui.js';

	let { value = $bindable(''), ...rest } = $props();
</script>

<div class="relative">
	<input {...rest} required bind:value class="{input} pr-8" />
	<span aria-hidden="true" class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-indigo-400">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			class="size-2.5"
		>
			<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
		</svg>
	</span>
</div>
