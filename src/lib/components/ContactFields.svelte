<script>
	import { m } from '#lib/paraglide/messages.js';
	import { label } from '#lib/ui.js';
	import PhoneInput from './PhoneInput.svelte';
	import RequiredInput from './RequiredInput.svelte';

	let { name = $bindable(''), phone = $bindable('') } = $props();
</script>

<div>
	<label for="name" class={label}>{m.labelName()}</label>
	<RequiredInput id="name" name="name" type="text" autocomplete="name" bind:value={name} />
</div>

<PhoneInput bind:value={phone} />
