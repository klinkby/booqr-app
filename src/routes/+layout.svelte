<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { AuthenticationService, TenantService, ApiError } from '$lib/api';
	import { auth, NavBar, LanguageToggle, locale, tenant } from '$lib';
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

	// Tenant bootstrap (client-only; ssr = false). Reserved/apex hosts are
	// categorised synchronously at tenant module init (status 'reserved') and
	// serve the marketing view without touching the API. Every other host is a
	// tenant candidate whose validity is decided ONLY by GET /api/my-tenant —
	// never assume a subdomain is valid client-side.
	$effect(() => {
		if (tenant.status !== 'loading') return;
		(async () => {
			try {
				const branding = await TenantService.getTenant();
				tenant.resolve(branding);
			} catch (err) {
				// 404 tenant-not-found → this host carries no tenant. Redirect the
				// browser to the marketing site with a full-page navigation (goto is
				// same-origin only) and do NOT render the tenant app shell — guarded
				// below so there is no flash of tenant UI. The ProblemDetails `type`
				// is the full URI …/problems/tenant-not-found; match the trailing slug.
				const notFound =
					err instanceof ApiError &&
					err.status === 404 &&
					(typeof err.body?.type !== 'string' || err.body.type.endsWith('/problems/tenant-not-found'));
				if (notFound) {
					tenant.setNotFound();
					window.location.assign('https://www.booqr.dk');
					return;
				}
				throw err;
			}
		})();
	});

	// Per-tenant branding: fall back to the app name until resolved.
	let brandName = $derived(tenant.displayName ?? 'Booqr');

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
	<title>{pageTitle ? `${pageTitle} · ${brandName}` : brandName}</title>
</svelte:head>

{#if tenant.isReserved}
	<!-- Reserved/apex host (booqr.dk, www, status): marketing/onboarding view,
	     not the booking app. Its own single <main>/<h1>. -->
	<a
		class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
		href="#main-content">{m.skipToMainContent()}</a
	>
	<main class="container mx-auto px-4 py-16 max-w-2xl text-center" id="main-content">
		<h1 class="text-4xl font-bold">{m.marketingHeading()}</h1>
		<p class="mt-4 text-xl text-gray-700">{m.marketingTagline()}</p>
		<p class="mt-6 text-gray-600">{m.marketingBody()}</p>
	</main>
{:else if tenant.isResolved}
	<QueryClientProvider client={queryClient}>
		<!-- Skip link for keyboard users -->
		<a
			class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
			href="#main-content"
		>
			{m.skipToMainContent()}
		</a>

		<NavBar {brandName} {links} {pageTitle} onlogout={auth.isLoggedIn ? handleLogout : undefined} />

		<main class="container mx-auto px-4 py-8 max-w-7xl" id="main-content">
			{@render children()}
		</main>

		<footer class="bg-gray-100 text-gray-600 mt-8">
			<div class="container mx-auto px-4 py-3 max-w-7xl text-sm flex justify-between items-center">
				<small class="text-sm">
					© 2026 Mads Klinkby,
					<a
						class="hover:text-gray-900 focus:text-gray-900 focus:outline-none focus:underline"
						href="https://github.com/klinkby/booqr-app/blob/main/LICENSE">AGPL licensed</a
					>.
				</small>
				<LanguageToggle current={locale.current} alternate={locale.alternate} ontoggle={() => locale.toggle()} />
			</div>
		</footer>
	</QueryClientProvider>
{:else}
	<!-- Resolving (loading) or redirecting after tenant-not-found. Guard the
	     tenant app shell so it never flashes for an unknown subdomain. The
	     status is announced accessibly via role="status" / aria-live. -->
	<main class="container mx-auto px-4 py-16 max-w-2xl text-center" id="main-content">
		<h1 class="sr-only">{tenant.isNotFound ? m.tenantRedirecting() : m.tenantResolving()}</h1>
		<p role="status" aria-live="polite" class="text-gray-600">
			{tenant.isNotFound ? m.tenantRedirecting() : m.tenantResolving()}
		</p>
	</main>
{/if}
