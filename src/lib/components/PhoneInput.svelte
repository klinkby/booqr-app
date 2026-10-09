<script>
	import { m } from '#lib/paraglide/messages.js';
	import { input, label } from '#lib/ui.js';
	import RequiredMark from './RequiredMark.svelte';

	let { value = $bindable(''), required = true } = $props();
</script>

<!-- Phone: editable -->
<div>
	<label for="phone" class={label}>{m.labelPhone()}</label>
	<div class="relative">
		<span
			aria-hidden="true"
			class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 sm:text-sm">+</span
		>
		<input
			id="phone"
			name="phone"
			type="tel"
			{required}
			pattern={'(3[0-46]|39|4[013-9])[0-9]{8}|(35[1-46-9]|37[0-2]|38[56]|42[01])[0-9]{7}'}
			title={m.phoneValidation()}
			placeholder={m.phonePlaceholder()}
			bind:value
			class="{input} pl-6 {required ? 'pr-8' : ''}"
		/>
		{#if required}
			<RequiredMark />
		{/if}
	</div>
</div>
