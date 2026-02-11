<script>
	import { UserService } from '$lib/api';
	import { auth, Form, ContactFields, PasswordReset, invokeApi } from '$lib';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let error = $state(null);
	let loading = $state(false);
	let loadingData = $state(true);
	let successMessage = $state(null);

	// Auth guard: redirect unauthenticated users
	$effect(() => {
		if (!auth.isLoggedIn) {
			goto('/login?returnUrl=/profile');
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
						<ContactFields bind:email bind:name bind:phone emailDisabled />
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
					<PasswordReset {email} invoker={invokeApi} />
				</div>
			</section>
		{/if}
	</div>
{/if}
