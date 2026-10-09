<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import favicon from '#lib/assets/favicon.svg';

	let { links = [], brandName = 'App', onlogout = undefined } = $props();
	let isOpen = $state(false);

	const ITEM = 'rounded-md px-3 py-2 text-sm font-semibold';
	const LINK = `${ITEM} text-gray-600 hover:bg-gray-100 hover:text-gray-900`;
	const CURRENT = `${ITEM} bg-indigo-50 text-indigo-700`;
	const ACTION = `inline-flex items-center gap-1.5 ${LINK}`;

	// Heroicons outline paths, drawn by the icon snippet.
	const ICONS = {
		signIn:
			'M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25',
		signOut:
			'M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9',
	};

	const isActive = (href) => {
		const resolved = resolve(href);
		const current = page.url.pathname;
		return href === '/' || href === '' ? current === resolved : current.startsWith(resolved);
	};
</script>

{#snippet icon(name)}
	<svg
		class="size-4 shrink-0"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		viewBox="0 0 24 24"
		aria-hidden="true"><path d={ICONS[name]} /></svg
	>
{/snippet}

<header class="sticky top-0 z-50 border-b border-gray-200 bg-white">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between gap-6">
			<a
				href={resolve('/')}
				class="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
			>
				<img src={favicon} alt="" class="size-6 shrink-0" />
				<span class="min-w-0 truncate text-xl font-bold tracking-tight text-gray-900">{brandName}</span>
			</a>

			<nav aria-label={m.navMainLabel()} class="hidden md:block">
				<ul class="flex items-center gap-1">
					{#each links as { name, href, icon: iconName } (href)}
						<li>
							<a
								href={resolve(href)}
								aria-current={isActive(href) ? 'page' : undefined}
								class="{isActive(href) ? CURRENT : LINK} {iconName ? 'inline-flex items-center gap-1.5' : ''}"
							>
								{#if iconName}{@render icon(iconName)}{/if}
								{name}
							</a>
						</li>
					{/each}
					{#if onlogout}
						<li class="ml-2 border-l border-gray-200 pl-3">
							<button type="button" onclick={onlogout} class={ACTION}>
								{@render icon('signOut')}
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
					{#each links as { name, href, icon: iconName } (href)}
						<li>
							<a
								href={resolve(href)}
								aria-current={isActive(href) ? 'page' : undefined}
								onclick={() => (isOpen = false)}
								class="{iconName ? 'flex items-center gap-1.5' : 'block'} {isActive(href) ? CURRENT : LINK}"
							>
								{#if iconName}{@render icon(iconName)}{/if}
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
								{@render icon('signOut')}
								{m.signOut()}
							</button>
						</li>
					{/if}
				</ul>
			</div>
		{/if}
	</div>
</header>
