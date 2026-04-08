<script>
	let { email = $bindable(''), error = null, message = null, loading = false, onsubmit } = $props();
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

	<div class="mb-4">
		<label for="reset-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
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

	<button
		type="button"
		disabled={loading}
		onclick={onsubmit}
		class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{loading ? 'Please wait\u2026' : 'Request Password Reset'}
	</button>
</div>
