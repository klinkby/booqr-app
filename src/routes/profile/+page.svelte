<script>
	import { UserService } from '$lib/api';
	import { auth, Form, invokeApi } from '$lib';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(true);
	let successMessage = $state(null);

	// Password reset state
	let resetMessage = $state(null);
	let resetError = $state(null);
	let resetLoading = $state(false);

	// Auth guard: redirect unauthenticated users
	$effect(() => {
		if (!auth.isLoggedIn) {
			goto('/login');
		}
	});

	async function loadProfile() {
		if (!auth.userId) return;

		loadingData = true;
		try {
			const user = await invokeApi(() => UserService.getUserById(auth.userId));
			name = user.name || '';
			phone = user.phone || '';
			email = user.email;
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to load profile:', err);
			}
			error = 'Failed to load profile. Please try again.';
		} finally {
			loadingData = false;
		}
	}

	async function handleSubmit() {
		error = null;
		successMessage = null;
		loading = true;
		try {
			await invokeApi(() => UserService.updateUser(auth.userId, { name, phone }));
			successMessage = 'Profile updated successfully.';
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to update profile:', err);
			}
			error = err.message || 'Failed to update profile. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleResetPassword() {
		resetError = null;
		resetMessage = null;
		resetLoading = true;
		try {
			await invokeApi(() => UserService.resetPassword({ email }));
			resetMessage = 'A password reset link has been sent to your email.';
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to request password reset:', err);
			}
			resetError = err.message || 'Failed to request password reset. Please try again.';
		} finally {
			resetLoading = false;
		}
	}

	onMount(() => {
		loadProfile();
	});
</script>

{#if auth.isLoggedIn}
	<div>
		<h1 class="text-3xl font-bold mb-6">My Profile</h1>

		{#if loadingData}
			<div role="status" aria-live="polite">
				<p>Loading...</p>
			</div>
		{:else}
			<!-- Section 1: Profile Information Form -->
			<section aria-labelledby="profile-heading">
				<h2 id="profile-heading" class="text-xl font-semibold mb-4">Profile Information</h2>
				<div class="max-w-2xl">
					<!-- Success message -->
					{#if successMessage}
						<div role="status" aria-live="polite" class="rounded-md bg-green-50 p-4 mb-4">
							<p class="text-sm text-green-800">{successMessage}</p>
						</div>
					{/if}

					<Form
						legend="Edit profile information"
						{error}
						{loading}
						submitLabel="Save Changes"
						onsubmit={handleSubmit}
					>
						<!-- Email: read-only display -->
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								disabled
								bind:value={email}
								class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed sm:text-sm"
								title="Email cannot be changed"
							/>
						</div>

						<!-- Name: editable -->
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
								Name
							</label>
							<input
								id="name"
								name="name"
								type="text"
								bind:value={name}
								class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>

						<!-- Phone: editable -->
						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
								Phone
							</label>
							<input
								id="phone"
								name="phone"
								type="tel"
								bind:value={phone}
								class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
					</Form>
				</div>
			</section>

			<!-- Section 2: Password Reset -->
			<section aria-labelledby="password-heading" class="mt-10">
				<h2 id="password-heading" class="text-xl font-semibold mb-4">Password</h2>
				<div class="max-w-2xl">
					<p class="text-sm text-gray-600 mb-4">
						Request a password reset link to be sent to your email address.
					</p>

					<!-- Success message -->
					{#if resetMessage}
						<div role="status" aria-live="polite" class="rounded-md bg-green-50 p-4 mb-4">
							<p class="text-sm text-green-800">{resetMessage}</p>
						</div>
					{/if}

					<!-- Error message -->
					{#if resetError}
						<div role="alert" aria-live="polite" class="rounded-md bg-red-50 p-4 mb-4">
							<p class="text-sm text-red-800">{resetError}</p>
						</div>
					{/if}

					<button
						type="button"
						disabled={resetLoading}
						onclick={handleResetPassword}
						class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{resetLoading ? 'Please wait…' : 'Request Password Reset'}
					</button>
				</div>
			</section>
		{/if}
	</div>
{/if}
