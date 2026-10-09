<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';

	let { links = [], brandName = 'App', onlogout = undefined } = $props();
	let isOpen = $state(false);

	const ITEM = 'rounded-md px-3 py-2 text-sm font-semibold';
	const LINK = `${ITEM} text-gray-600 hover:bg-gray-100 hover:text-gray-900`;
	const CURRENT = `${ITEM} bg-indigo-50 text-indigo-700`;
	const ACTION = `inline-flex items-center gap-1.5 ${LINK}`;

	const isActive = (href) => {
		const resolved = resolve(href);
		const current = page.url.pathname;
		return href === '/' || href === '' ? current === resolved : current.startsWith(resolved);
	};
</script>

<header class="sticky top-0 z-50 border-b border-gray-200 bg-white">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between gap-6">
			<a
				href={resolve('/')}
				class="flex min-w-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
			>
				<span class="min-w-0 truncate text-xl font-bold tracking-tight text-gray-900">{brandName}</span>
			</a>

			<nav aria-label={m.navMainLabel()} class="hidden md:block">
				<ul class="flex items-center gap-1">
					{#each links as { name, href } (href)}
						<li>
							<a
								href={resolve(href)}
								aria-current={isActive(href) ? 'page' : undefined}
								class={isActive(href) ? CURRENT : LINK}
							>
								{name}
							</a>
						</li>
					{/each}
					{#if onlogout}
						<li class="ml-2 border-l border-gray-200 pl-3">
							<button type="button" onclick={onlogout} class={ACTION}>
								<svg
									class="size-4"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									viewBox="0 0 24 24"
									aria-hidden="true"
									><path
										d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
									/></svg
								>
								{m.signOut()}
							</button>
						</li>
					{/if}
				</ul>
			</nav>

			<button
				type="button"
				onclick={() => (isOpen = !isOpen)}
				aria-expanded={isOpen}
				aria-label={m.navToggleMenu()}
				class="-mr-2 rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
			>
				<svg
					class="size-6"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					viewBox="0 0 24 24"
					aria-hidden="true"
					><path d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'} /></svg
				>
			</button>
		</div>

		{#if isOpen}
			<div class="border-t border-gray-200 py-3 md:hidden">
				<ul class="space-y-1">
					{#each links as { name, href } (href)}
						<li>
							<a
								href={resolve(href)}
								aria-current={isActive(href) ? 'page' : undefined}
								onclick={() => (isOpen = false)}
								class="block {isActive(href) ? CURRENT : LINK}"
							>
								{name}
							</a>
						</li>
					{/each}
					{#if onlogout}
						<li>
							<button
								type="button"
								onclick={() => {
									isOpen = false;
									onlogout();
								}}
								class="{ACTION} w-full"
							>
								{m.signOut()}
							</button>
						</li>
					{/if}
				</ul>
			</div>
		{/if}
	</div>
</header>
