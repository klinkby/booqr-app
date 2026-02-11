<script>
	import {UserService} from '$lib/api';
	import {auth, Form, ContactFields} from '$lib';
	import {goto} from '$app/navigation';

	let email = $state('');
	let name = $state('');
	let phone = $state('');
	let error = $state(null);
	let loading = $state(false);
	let success = $state(false);

	$effect(() => {
		if (auth.isLoggedIn) {
			goto('/profile');
		}
	});

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			await UserService.addUser({email});
			success = true;
		} catch (err) {
			error = err.message || 'Sign-up failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div>
	<h1 class="text-3xl font-bold mb-6">Create an account</h1>

	<div class="max-w-2xl">
		{#if success}
			<div class="rounded-md bg-green-50 p-4" role="status" aria-live="polite">
				<p class="text-sm text-green-800">Account created! Check your email for a link to set your password.</p>
			</div>
		{:else}
			<Form {error} legend="Sign up" {loading} onsubmit={handleSubmit} submitLabel="Sign up">
				<ContactFields bind:email bind:name bind:phone />
			</Form>
		{/if}

		<p class="mt-4 text-sm text-gray-600">
			Already have an account?
			<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">
				Sign in
			</a>
		</p>
	</div>
</div>
