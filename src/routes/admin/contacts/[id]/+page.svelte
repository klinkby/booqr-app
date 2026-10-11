<script>
	import { ConfirmDialog, Form, RequiredInput, apiErrorMessage, PhoneInput } from '#lib';
	import { auth } from '#lib/auth.svelte.js';
	import { buttonSecondary, cardSection, input, label, link, success } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { useContactData } from './contactData.svelte.js';
	import { canChangeRole, ROLES } from './roleChange.js';
	import { m } from '#lib/paraglide/messages.js';

	let id = $derived(page.params.id);
	let isEdit = $derived(id !== 'new');
	let editable = $derived(canChangeRole(auth.role, auth.userId, id));

	const contact = useContactData();

	let email = $state('');
	let name = $state('');
	let phone = $state('');
	let role = $state('Customer');
	let newRole = $state('Customer');
	let confirmOpen = $state(false);
	let roleLoading = $state(false);
	let roleChanged = $state(false);
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(false);

	function roleLabel(value) {
		if (value === 'Employee') return m.employee();
		if (value === 'Admin') return m.roleAdmin();
		return m.customer();
	}

	onMount(async () => {
		if (!isEdit) return;
		loadingData = true;
		try {
			const existing = await contact.getContact(id);
			email = existing.email;
			name = existing.name || '';
			phone = existing.phone || '';
			role = existing.role;
			newRole = existing.role;
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

	async function handleRoleConfirm() {
		error = null;
		roleChanged = false;
		roleLoading = true;
		try {
			await contact.changeRole({ id, role: newRole });
			role = newRole;
			roleChanged = true;
			confirmOpen = false;
		} catch (err) {
			confirmOpen = false;
			error = err?.status === 409 ? m.changeRoleConflict() : apiErrorMessage(err);
		} finally {
			roleLoading = false;
		}
	}

	function handleRoleCancel() {
		confirmOpen = false;
		newRole = role;
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
							{#if editable}
								<div class="flex gap-3">
									<select id="role" name="role" class={input} bind:value={newRole}>
										{#each ROLES as option (option)}
											<option value={option}>{roleLabel(option)}</option>
										{/each}
									</select>
									<button
										type="button"
										class="{buttonSecondary} whitespace-nowrap"
										disabled={newRole === role}
										onclick={() => (confirmOpen = true)}>{m.changeRole()}</button
									>
								</div>
								<div role="status" aria-live="polite" class="{success} mt-2" class:hidden={!roleChanged}>
									{m.roleChanged()}
								</div>
							{:else}
								<input
									id="role"
									name="role"
									type="text"
									disabled
									bind:value={role}
									class={input}
									title={m.roleCannotBeChanged()}
								/>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</Form>

		{#if editable}
			<ConfirmDialog
				open={confirmOpen}
				title={m.changeRoleConfirmTitle()}
				message={m.changeRoleConfirmMessage({ name: name || email, from: roleLabel(role), to: roleLabel(newRole) })}
				confirmLabel={m.changeRole()}
				loading={roleLoading}
				onconfirm={handleRoleConfirm}
				oncancel={handleRoleCancel}
			/>
		{/if}
	{/if}
</div>
