<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { AuthenticationService } from '$lib/api';
	import { auth, NavBar } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '$lib/queryClient';
	import { getLocale, getTextDirection } from '$lib/paraglide/runtime.js';
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();

	$effect(() => {
		const locale = getLocale();
		document.documentElement.lang = locale;
		document.documentElement.dir = getTextDirection(locale);
	});

	function titleFromPath(pathname) {
		const seg = pathname.split('/').filter(Boolean);
		if (!seg.length) return null;

		if (seg.length === 3 && seg[0] === 'admin') {
			const labels = {
				contacts: { create: m.titleCreateContact(), edit: m.titleEditContact() },
				services: { create: m.titleCreateService(), edit: m.titleEditService() },
				locations: { create: m.titleCreateLocation(), edit: m.titleEditLocation() },
			};
			const entry = labels[seg[1]];
			if (entry) return seg[2] === 'new' ? entry.create : entry.edit;
		}

		return (
			{
				login: m.titleSignIn(),
				profile: m.titleMyProfile(),
				'change-password': m.titleChangePassword(),
				plan: m.titlePlan(),
				contacts: m.titleContacts(),
				services: m.titleServices(),
				locations: m.titleLocations(),
			}[seg.at(-1)] ?? null
		);
	}

	let pageTitle = $derived(titleFromPath(page.url.pathname));

	let links = $derived([
		...(auth.isEmployee
			? [
					{ name: m.navPlan(), href: '/admin/plan' },
					{ name: m.navContacts(), href: '/admin/contacts' },
					{ name: m.navServices(), href: '/admin/services' },
					{ name: m.navLocations(), href: '/admin/locations' },
				]
			: []),
		...(auth.isLoggedIn ? [{ name: m.navMyProfile(), href: '/profile' }] : []),
		...(auth.isLoggedIn ? [] : [{ name: m.navSignIn(), href: '/login' }]),
	]);

	async function handleLogout() {
		try {
			await AuthenticationService.logout();
		} catch {
			// Continue with logout even if API call fails
		} finally {
			auth.clear();
			queryClient.clear();
			goto(resolve('/'));
		}
	}
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<!-- Skip link for keyboard users -->
	<a
		class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
		href="#main-content"
	>
		{m.skipToMainContent()}
	</a>

	<NavBar brandName="Booqr" {links} {pageTitle} onlogout={auth.isLoggedIn ? handleLogout : undefined} />

	<main class="container mx-auto px-4 py-8 max-w-7xl" id="main-content">
		{@render children()}
	</main>

	<footer class="bg-gray-100 text-gray-600 mt-8">
		<div class="container mx-auto px-4 max-w-7xl text-sm">
			<small>&copy; {new Date().getFullYear()} Booqr</small>
		</div>
	</footer>
</QueryClientProvider>
