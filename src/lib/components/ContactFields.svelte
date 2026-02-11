<script>
	let { email = $bindable(), name = $bindable(), phone = $bindable(), emailDisabled = false } = $props();
</script>

<div>
	<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
		Email
	</label>
	<input
		id="email"
		name="email"
		type="email"
		required
		disabled={emailDisabled}
		bind:value={email}
		class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
		title={emailDisabled ? 'Email cannot be changed' : undefined}
	/>
</div>

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
