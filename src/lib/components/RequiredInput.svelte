<!--
  Required text input with the design.md asterisk inside its right edge.
  The asterisk is aria-hidden: screen readers announce the `required` attribute.
  Pass the input attributes (id, name, type, autocomplete…) as props; bind:value works.
-->
<script>
	import { input } from '#lib/ui.js';
	import RequiredMark from './RequiredMark.svelte';

	let { value = $bindable(''), ...rest } = $props();
</script>

<div class="relative">
	<input {...rest} required bind:value class="{input} pr-8" />
	<RequiredMark />
</div>
