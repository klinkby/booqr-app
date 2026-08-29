<script>
	import { m } from '$lib/paraglide/messages.js';

	let { value = $bindable(''), required = true } = $props();
</script>

<!-- Phone: editable -->
<div>
	<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">{m.labelPhone()}</label>
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
			class="block w-full px-3 py-2 pl-5 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
		/>
	</div>
</div>
