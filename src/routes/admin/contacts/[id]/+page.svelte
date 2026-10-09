<script>
	import { Form, RequiredInput, apiErrorMessage, PhoneInput } from '#lib';
	import { cardSection, input, label, link } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { useContactData } from './contactData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	let id = $derived(page.params.id);
	let isEdit = $derived(id !== 'new');

	const contact = useContactData();

	let email = $state('');
	let name = $state('');
	let phone = $state('');
	let role = $state('Customer');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	onMount(async () => {
		if (!isEdit) return;
		loadingData = true;
		try {
			const existing = await contact.getContact(id);
			email = existing.email;
			name = existing.name || '';
			phone = existing.phone || '';
			role = existing.role;
		} catch (err) {
			error = apiErrorMessage(err);
		} finally {
			loadingData = false;
		}
	});

	async function handleSubmit() {
		error = null;
		loading = true;
		try {
			await contact.saveContact({ id, isEdit, payload: isEdit ? { name, phone } : { email } });
			await goto(resolve('admin/contacts'));
		} catch (err) {
			error = apiErrorMessage(err);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto(resolve('admin/contacts'));
	}
</script>

<div>
	{#if loadingData}
		<p role="status" aria-live="polite" class="text-sm text-gray-500">{m.loading()}</p>
	{:else}
		<Form
			card
			legend={isEdit ? m.legendEditContact() : m.legendCreateContact()}
			{error}
			{loading}
			submitLabel={isEdit ? m.update() : m.create()}
			onsubmit={handleSubmit}
			oncancel={handleCancel}
		>
			<div class={cardSection}>
				<div class="space-y-4">
					<div>
						{#if isEdit}
							<span id="email-label" class={label}>{m.labelEmail()}</span>
							<a href="mailto:{email}" aria-labelledby="email-label" class={link}>{email}</a>
						{:else}
							<label for="email" class={label}>{m.labelEmail()}</label>
							<RequiredInput id="email" name="email" type="email" bind:value={email} />
						{/if}
					</div>

					{#if isEdit}
						<div>
							<label for="name" class={label}>{m.labelName()}</label>
							<input id="name" name="name" type="text" bind:value={name} class={input} />
						</div>

						<PhoneInput bind:value={phone} required={false} />

						<div>
							<label for="role" class={label}>{m.labelRole()}</label>
							<input
								id="role"
								name="role"
								type="text"
								disabled
								bind:value={role}
								class={input}
								title={m.roleCannotBeChanged()}
							/>
						</div>
					{/if}
				</div>
			</div>
		</Form>
	{/if}
</div>
