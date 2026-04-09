<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { links = [], brandName = 'App', onlogout = undefined } = $props();
	let isOpen = $state(false);

	// Enhanced check: matches exact for home, startsWith for sub-routes
	const isActive = (href) => {
		const resolved = resolve(href);
		const current = page.url.pathname;
		return href === '/' || href === '' ? current === resolved : current.startsWith(resolved);
	};
</script>

<nav aria-label="Main navigation" class="bg-white border-b border-gray-200 sticky top-0 z-50">
	<div class="container mx-auto  px-4 max-w-7xl">
		<div class="flex justify-between h-16 items-center">
			<div class="flex items-center gap-6">
				<a href={resolve('/')} class="font-bold text-xl hover:opacity-80 transition-opacity">
					{brandName}
				</a>

				<div class="hidden md:flex items-center space-x-6">
					{#each links as { name, href } (href)}
						<a
							href={resolve(href)}
							class="text-sm font-medium transition-colors {isActive(href)
								? 'text-indigo-600'
								: 'text-gray-500 hover:text-gray-900'}"
						>
							{name}
						</a>
					{/each}
					{#if onlogout}
						<button
							onclick={onlogout}
							class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
						>
							Logout
						</button>
					{/if}
				</div>
			</div>

			<button
				onclick={() => (isOpen = !isOpen)}
				aria-expanded={isOpen}
				aria-label="Toggle menu"
				class="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
			>
				<svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path
						d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	</div>

	{#if isOpen}
		<div class="md:hidden border-t border-gray-100 bg-white">
			<div class="container mx-auto px-4 max-w-7xl py-3 space-y-1">
				{#each links as { name, href } (href)}
					<a
						href={resolve(href)}
						onclick={() => (isOpen = false)}
						class="block py-2.5 px-3 rounded-lg font-medium transition-colors {isActive(href)
							? 'bg-indigo-50 text-indigo-600'
							: 'text-gray-600 hover:bg-gray-50'}"
					>
						{name}
					</a>
				{/each}
				{#if onlogout}
					<button
						onclick={() => {
							isOpen = false;
							onlogout();
						}}
						class="block w-full text-left py-2.5 px-3 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
					>
						Logout
					</button>
				{/if}
			</div>
		</div>
	{/if}
</nav>
