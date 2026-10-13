<script>
	import { m } from '#lib/paraglide/messages.js';
	import { label } from '#lib/ui.js';
	import PhoneInput from './PhoneInput.svelte';
	import RequiredInput from './RequiredInput.svelte';

	// `children` renders between name and phone (forms put the email field there).
	let { name = $bindable(''), phone = $bindable(''), children } = $props();
</script>

<div>
	<label for="name" class={label}>{m.labelName()}</label>
	<RequiredInput id="name" name="name" type="text" autocomplete="name" bind:value={name} />
</div>

{@render children?.()}

<PhoneInput bind:value={phone} />
