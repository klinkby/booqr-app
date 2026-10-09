<script>
	import { resolve } from '$app/paths';
	import { Form, PasswordReset, RequiredInput, apiErrorMessage } from '#lib';
	import { alert, cardSection, label } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useChangePasswordData } from './changePasswordData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	const cp = useChangePasswordData();

	let password = $state('');
	let confirmPassword = $state('');
	let error = $state(null);
	let loading = $state(false);

	let resetEmail = $state('');
	let resetError = $state(null);
	let resetMessage = $state(null);
	let resetLoading = $state(false);

	const passwordPattern = /^(?=(.*[0-9]))(?=.*[!@#$%^&*()[{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z])).{8,}$/;

	let action = $derived(page.url.searchParams.get('action'));
	let expires = $derived(page.url.searchParams.get('expires'));

	let expired = $derived.by(() => {
		if (!expires) return true;
		return new Date(expires + 'Z') <= new Date();
	});

	async function handleReset() {
		resetError = null;
		resetMessage = null;

		if (!resetEmail) {
			resetError = m.pleaseEnterEmail();
			return;
		}

		resetLoading = true;
		try {
			await cp.requestReset(resetEmail);
			resetMessage = m.passwordResetSent();
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to request password reset:', err);
			}
			resetError = apiErrorMessage(err);
		} finally {
			resetLoading = false;
		}
	}

	async function handleSubmit() {
		error = null;

		if (password !== confirmPassword) {
			error = m.passwordsDoNotMatch();
			return;
		}

		if (!passwordPattern.test(password)) {
			error = m.passwordRequirements();
			return;
		}

		loading = true;
		try {
			await cp.changePassword({ password, query: Object.fromEntries(page.url.searchParams) });

			password = '';
			confirmPassword = '';
			await goto(resolve('login'));
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to change password:', err);
			}
			error = apiErrorMessage(err);
		} finally {
			loading = false;
		}
	}
</script>

<div>
	{#if !action}
		<p class="mb-6 text-sm text-gray-600">
			{m.changePasswordIntro()}
		</p>
		<PasswordReset
			bind:email={resetEmail}
			error={resetError}
			message={resetMessage}
			loading={resetLoading}
			onsubmit={handleReset}
		/>
	{:else if expired}
		<div role="alert" class="{alert} mb-6">
			<p>{m.passwordResetExpired()}</p>
		</div>
		<PasswordReset
			bind:email={resetEmail}
			error={resetError}
			message={resetMessage}
			loading={resetLoading}
			onsubmit={handleReset}
		/>
	{:else}
		<Form
			card
			legend={m.legendChangePassword()}
			{error}
			{loading}
			submitLabel={m.changePassword()}
			onsubmit={handleSubmit}
		>
			<div class="{cardSection} space-y-4">
				<div>
					<label for="password" class={label}>{m.labelNewPassword()}</label>
					<RequiredInput
						id="password"
						name="password"
						type="password"
						minlength="8"
						autocomplete="new-password"
						bind:value={password}
					/>
				</div>

				<div>
					<label for="confirm-password" class={label}>{m.labelConfirmNewPassword()}</label>
					<RequiredInput
						id="confirm-password"
						name="confirm-password"
						type="password"
						minlength="8"
						autocomplete="new-password"
						bind:value={confirmPassword}
					/>
				</div>
			</div>
		</Form>
	{/if}
</div>
