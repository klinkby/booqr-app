<script>
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { AuthenticationService, TenantService, ApiError } from '#lib/api/index.js';
	import { auth, NavBar, LanguageToggle, locale, tenant, MARKETING_URL } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '#lib/queryClient.js';
	import { getLocale, getTextDirection } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';

	let { children } = $props();

	const SKIP_LINK =
		'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-indigo-700 focus:shadow-lg focus:ring-1 focus:ring-gray-900/10';
	const FOOTER_LINK = 'underline decoration-gray-300 underline-offset-2 hover:text-gray-900 hover:decoration-gray-500';

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
				// Require an explicit ProblemDetails `type` (mirrors isTenantMismatch
				// in queryClient.js): a bare 404 from a CDN/proxy/gateway is a
				// transient failure, not a genuine tenant-not-found — treat it as an
				// error so a valid tenant is never ejected off the app.
				const notFound =
					err instanceof ApiError &&
					err.status === 404 &&
					typeof err.body?.type === 'string' &&
					err.body.type.endsWith('/problems/tenant-not-found');
				if (notFound) {
					tenant.setNotFound();
					window.location.assign(MARKETING_URL);
					return;
				}
				// Any other failure (500, network, CORS, bare 404) is retryable: show
				// an error UI instead of hanging on 'loading' forever. Do not re-throw
				// — this runs in a fire-and-forget IIFE and a throw would only become
				// an uncaught rejection.
				tenant.setError();
			}
		})();
	});

	// Per-tenant branding: fall back to the app name until resolved.
	let brandName = $derived(tenant.displayName ?? m.marketingHeading());

	let segments = $derived(page.url.pathname.split('/').filter(Boolean));

	function titleFromPath(seg) {
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

	let pageTitle = $derived(titleFromPath(segments));

	// Single-column form pages (centred max-w-2xl), see design.md › Forms.
	let isFormPage = $derived(
		(segments.length === 3 && segments[0] === 'admin') ||
			(segments.length === 1 && ['login', 'change-password'].includes(segments[0])),
	);

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
	<a class={SKIP_LINK} href="#main-content">{m.skipToMainContent()}</a>
	<main class="container mx-auto px-4 py-16 max-w-2xl text-center" id="main-content">
		<h1 class="text-4xl font-bold">{m.marketingHeading()}</h1>
		<p class="mt-4 text-xl text-gray-700">{m.marketingTagline()}</p>
		<p class="mt-6 text-gray-600">{m.marketingBody()}</p>
	</main>
{:else if tenant.isResolved}
	<QueryClientProvider client={queryClient}>
		<!-- Skip link for keyboard users -->
		<div class="flex min-h-dvh flex-col bg-gray-50">
			<a class={SKIP_LINK} href="#main-content">{m.skipToMainContent()}</a>

			<NavBar {brandName} {links} onlogout={auth.isLoggedIn ? handleLogout : undefined} />

			<main class="flex-1" id="main-content">
				<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
					<div class={isFormPage ? 'mx-auto max-w-2xl' : undefined}>
						{#if pageTitle}
							<h1 class="mb-6 text-xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>
						{/if}
						{@render children()}
					</div>
				</div>
			</main>

			<footer class="border-t border-gray-200">
				<div
					class="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-4 text-xs text-gray-500 sm:px-6 lg:px-8"
				>
					<a class={FOOTER_LINK} href="https://github.com/klinkby/booqr-app?tab=AGPL-3.0-1-ov-file">© 2026 Klinkby</a>
					<span aria-hidden="true" class="text-gray-300">·</span>
					<a class={FOOTER_LINK} href="{MARKETING_URL}/terms">{m.termsAndConditions()}</a>
					<span aria-hidden="true" class="text-gray-300">·</span>
					<LanguageToggle current={locale.current} alternate={locale.alternate} ontoggle={() => locale.toggle()} />
				</div>
			</footer>
		</div>
	</QueryClientProvider>
{:else if tenant.isError}
	<!-- Non-404 resolution failure (500, network, CORS, bare 404): retryable
	     error instead of hanging on the loading interstitial. Its own single
	     <main>/<h1>. Retry resets tenant status to 'loading', re-triggering the
	     bootstrap $effect above. -->
	<a class={SKIP_LINK} href="#main-content">{m.skipToMainContent()}</a>
	<main class="container mx-auto px-4 py-16 max-w-2xl text-center" id="main-content">
		<h1 class="text-2xl font-bold">{m.tenantErrorHeading()}</h1>
		<p role="alert" class="mt-4 text-gray-700">{m.tenantErrorBody()}</p>
		<button
			class="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
			type="button"
			onclick={() => tenant.retry()}
		>
			{m.tenantRetry()}
		</button>
	</main>
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
