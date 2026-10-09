<script>
	import { auth, Form, RequiredInput, apiErrorMessage } from '#lib';
	import { cardSection, label, link } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { useLoginData } from './loginData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';

	const loginData = useLoginData();

	let email = $state('');
	let password = $state('');
	let error = $state(null);
	let loading = $state(false);

	// Use $derived for reactive access to URL search params (Svelte 5 best practice)
	function normalizeReturnUrl(raw) {
		if (!raw || typeof raw !== 'string') {
			return '/';
		}

		// Only allow same-origin, absolute paths starting with a single "/"
		if (!raw.startsWith('/') || raw.startsWith('//')) {
			return '/';
		}

		// Disallow explicit schemes (e.g., "http://", "javascript:", etc.)
		if (raw.includes('://')) {
			return '/';
		}

		return raw;
	}

	let returnUrl = $derived(normalizeReturnUrl(page.url.searchParams.get('returnUrl')));

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			const response = await loginData.login({ email, password });
			// Clear password from memory
			password = '';
			auth.accessToken = response.access_token;
			// Store access token (response should contain token)
			if (auth.isLoggedIn) {
				// Redirect to the page that triggered login, or home if none

				await goto(returnUrl);
			} else {
				error = m.authenticationFailed();
			}
		} catch (err) {
			// Log error in development mode for debugging
			if (import.meta.env.DEV) {
				console.error('Login error:', err);
			}
			// Try to use the error message from API if available
			error = apiErrorMessage(err);
		} finally {
			loading = false;
		}
	}
</script>

<div>
	<Form card {error} legend={m.signIn()} {loading} onsubmit={handleSubmit} submitLabel={m.signIn()}>
		<div class="{cardSection} space-y-4">
			<div>
				<label for="email" class={label}>{m.labelEmailAddress()}</label>
				<RequiredInput
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					placeholder={m.labelEmailAddress()}
					bind:value={email}
				/>
			</div>

			<div>
				<div class="flex items-center justify-between">
					<label for="password" class={label}>{m.labelPassword()}</label>
					<a href={resolve('change-password')} class="{link} mb-2 text-sm">{m.forgotPassword()}</a>
				</div>
				<RequiredInput
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					placeholder={m.labelPassword()}
					bind:value={password}
				/>
			</div>
		</div>
	</Form>
</div>
