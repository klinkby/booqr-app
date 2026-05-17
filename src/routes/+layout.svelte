<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { AuthenticationService } from '$lib/api';
	import { auth, NavBar } from '$lib';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	function titleFromPath(pathname) {
		const seg = pathname.split('/').filter(Boolean);
		if (!seg.length) return null;

		if (seg.length === 3 && seg[0] === 'admin') {
			const label = { contacts: 'Contact', services: 'Service', locations: 'Location' }[seg[1]];
			if (label) return seg[2] === 'new' ? `Create ${label}` : `Edit ${label}`;
		}

		return (
			{
				login: 'Sign in',
				profile: 'My Profile',
				'change-password': 'Change Password',
				plan: 'Plan',
				contacts: 'Contacts',
				services: 'Services',
				locations: 'Locations',
			}[seg.at(-1)] ?? null
		);
	}

	let pageTitle = $derived(titleFromPath(page.url.pathname));

	let links = $derived([
		...(auth.isEmployee
			? [
					{ name: 'Plan', href: '/admin/plan' },
					{ name: 'Contacts', href: '/admin/contacts' },
					{ name: 'Services', href: '/admin/services' },
					{ name: 'Locations', href: '/admin/locations' },
				]
			: []),
		...(auth.isLoggedIn ? [{ name: 'My Profile', href: '/profile' }] : []),
		...(auth.isLoggedIn ? [] : [{ name: 'Sign in', href: '/login' }]),
	]);

	async function handleLogout() {
		try {
			await AuthenticationService.logout();
		} catch {
			// Continue with logout even if API call fails
		} finally {
			auth.clear();
			if (window.location.pathname === '/') {
				await invalidate('app:bookings');
			} else {
				goto(resolve('/'));
			}
		}
	}
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

<!-- Skip link for keyboard users -->
<a
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
	href="#main-content"
>
	Skip to main content
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
