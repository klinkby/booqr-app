<script>
	import { UserService } from '$lib/api';

	let { email = $bindable(''), invoker = undefined } = $props();

	let message = $state(null);
	let error = $state(null);
	let loading = $state(false);

	async function handleReset() {
		error = null;
		message = null;

		if (!email) {
			error = 'Please enter your email address.';
			return;
		}

		loading = true;
		try {
			const apiCall = () => UserService.resetPassword({ email });
			await (invoker ? invoker(apiCall) : apiCall());
			message = 'A password reset link has been sent to your email.';
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to request password reset:', err);
			}
			error = err.message || 'Failed to request password reset. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div>
	<!-- Success message -->
	<div role="status" aria-live="polite" class="rounded-md bg-green-50 p-4 mb-4" class:hidden={!message}>
		<p class="text-sm text-green-800">{message}</p>
	</div>

	<!-- Error message -->
	<div role="alert" aria-live="polite" class="rounded-md bg-red-50 p-4 mb-4" class:hidden={!error}>
		<p class="text-sm text-red-800">{error}</p>
	</div>

	{#if !invoker}
		<div class="mb-4">
			<label for="reset-email" class="block text-sm font-medium text-gray-700 mb-1">
				Email address
			</label>
			<input
				id="reset-email"
				name="email"
				type="email"
				required
				autocomplete="email"
				bind:value={email}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
			/>
		</div>
	{/if}

	<button
		type="button"
		disabled={loading}
		onclick={handleReset}
		class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{loading ? 'Please wait…' : 'Request Password Reset'}
	</button>
</div>
