<script>
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { COUNTRIES, DEFAULT_CODE, decodePhone, encodePhone, nationalPattern } from '#lib/phone.js';
	import { input, label } from '#lib/ui.js';
	import RequiredMark from './RequiredMark.svelte';

	// `value` is the API's single numeric string: calling code + subscriber number.
	let { value = $bindable('') } = $props();

	const regionNames = new Intl.DisplayNames(getLocale(), { type: 'region' });
	// Regional-indicator pair = flag emoji, e.g. 'DK' → 🇩🇰.
	const flag = (region) => String.fromCodePoint(...[...region].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));
	const options = COUNTRIES.map((c) => ({
		code: c.code,
		name: regionNames.of(c.region),
		text: `${flag(c.region)} +${c.code}`,
	}));

	const decoded = $derived(decodePhone(value));
	// Remembers the picked code while there is no number yet (value is '' then).
	let picked = $state(null);
	const code = $derived(decoded.matched ? decoded.code : (picked ?? DEFAULT_CODE));
	const countryName = $derived(options.find((o) => o.code === code)?.name);

	function onCodeChange(event) {
		picked = event.currentTarget.value;
		if (decoded.matched) value = encodePhone(picked, decoded.national);
	}

	function onNumberInput(event) {
		const digits = event.currentTarget.value.replace(/\D/g, '');
		event.currentTarget.value = digits;
		value = encodePhone(code, digits);
	}
</script>

<div>
	<label id="phoneLabel" for="phone" class={label}>{m.labelPhone()}</label>
	<div class="flex gap-2">
		<div class="w-28 shrink-0">
			<select
				id="phoneCountry"
				name="phoneCountry"
				class={input}
				aria-labelledby="phoneLabel"
				title={countryName}
				onchange={onCodeChange}
			>
				{#each options as option (option.code)}
					<option value={option.code} title={option.name} selected={option.code === code}>{option.text}</option>
				{/each}
			</select>
		</div>
		<div class="relative min-w-0 flex-1">
			<input
				id="phone"
				name="phone"
				type="tel"
				inputmode="numeric"
				autocomplete="tel-national"
				required
				pattern={nationalPattern(code)}
				value={decoded.national}
				oninput={onNumberInput}
				class="{input} pr-8"
			/>
			<RequiredMark />
		</div>
	</div>
</div>
