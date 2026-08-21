<script>
	import { resolve } from '$app/paths';
	import { Form, PasswordReset, apiErrorMessage } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { useChangePasswordData } from './changePasswordData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

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

	let action = $derived($page.url.searchParams.get('action'));
	let expires = $derived($page.url.searchParams.get('expires'));

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
			await cp.changePassword({ password, query: Object.fromEntries($page.url.searchParams) });

			password = '';
			confirmPassword = '';
			await goto(resolve('/login'));
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
	<div class="max-w-2xl">
		{#if !action}
			<p class="text-sm text-gray-600 mb-4">
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
			<div role="alert" class="rounded-md bg-red-50 p-4 mb-6">
				<p class="text-sm text-red-800">{m.passwordResetExpired()}</p>
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
				legend={m.legendChangePassword()}
				{error}
				{loading}
				submitLabel={m.changePassword()}
				onsubmit={handleSubmit}
			>
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelNewPassword()} </label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						bind:value={password}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">
						{m.labelConfirmNewPassword()}
					</label>
					<input
						id="confirm-password"
						name="confirm-password"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						bind:value={confirmPassword}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>
			</Form>
		{/if}
	</div>
</div>
