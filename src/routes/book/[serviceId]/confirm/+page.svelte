<script>
	import { BookingSummary, Form, LimitedTextarea, apiErrorMessage, auth } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { DateUtils } from '$lib/dateUtils.js';
	import { onMount } from 'svelte';
	import { useConfirmData } from './confirmData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	const confirmData = useConfirmData();

	const serviceId = $derived(page.params.serviceId);
	const vacancyId = $derived(page.url.searchParams.get('vacancy'));
	const startIso = $derived(page.url.searchParams.get('start'));
	const rebookNonce = $derived(page.url.searchParams.get('rebook'));
	const linkValid = $derived(!!vacancyId && !!startIso);

	const service = $derived(confirmData.services.find((s) => String(s.id) === String(serviceId)));
	const startDate = $derived(startIso ? new Date(startIso) : null);
	const durationMs = $derived(DateUtils.parseDurationSeconds(service?.duration) * 1000);
	const endDate = $derived(startDate && durationMs ? new Date(startDate.getTime() + durationMs) : null);

	let vacancy = $state(null);
	let vacancyError = $state(null);

	onMount(async () => {
		if (!vacancyId) return;
		try {
			vacancy = await confirmData.getVacancy(vacancyId);
		} catch (err) {
			vacancyError = apiErrorMessage(err, m.errorLoadTimeSlot());
		}
	});

	const employeeName = $derived(
		confirmData.employees.find((e) => String(e.id) === String(vacancy?.employeeId))?.name ?? '',
	);
	const locationName = $derived(
		confirmData.locations.find((l) => String(l.id) === String(vacancy?.locationId))?.name ?? '',
	);

	// --- Step 6: inline auth gate ---
	let authMode = $state('login'); // 'login' | 'signup'
	let email = $state('');
	let password = $state('');
	let acceptTerms = $state(false);
	let authError = $state(null);
	let authLoading = $state(false);
	let signUpSent = $state(false);

	async function handleLogin() {
		authError = null;
		authLoading = true;
		try {
			const response = await confirmData.login({ email, password });
			password = '';
			auth.accessToken = response.access_token;
			if (!auth.isLoggedIn) authError = m.authenticationFailed();
		} catch (err) {
			authError = apiErrorMessage(err);
		} finally {
			authLoading = false;
		}
	}

	async function handleSignUp() {
		authError = null;
		authLoading = true;
		try {
			await confirmData.signUp(email);
		} catch {
			// Same message shown either way — differentiating would leak which
			// addresses already have accounts.
		} finally {
			signUpSent = true;
			authLoading = false;
		}
	}

	function switchToSignUp() {
		authMode = 'signup';
		authError = null;
	}
	function switchToLogin() {
		authMode = 'login';
		authError = null;
		signUpSent = false;
	}

	// --- Step 7: confirmation form ---
	let notes = $state('');
	let acceptCancellation = $state(false);
	let cancellationError = $state(null);
	let bookLoading = $state(false);
	let bookError = $state(null);

	async function handleBook() {
		cancellationError = null;
		bookError = null;
		if (!acceptCancellation) {
			cancellationError = m.cancellationPolicyError();
			return;
		}
		bookLoading = true;
		try {
			await confirmData.addBooking({
				customerId: null,
				vacancyId,
				serviceId,
				notes: notes || null,
				startTime: startDate.toISOString(),
			});
			// Rebook: if this booking replaces a prior one (started via "Reschedule" on
			// the profile), delete the old booking now that the new one is confirmed.
			// The stored token is consumed only when its one-time nonce matches the
			// one carried through the wizard URL — so an unrelated booking for the
			// same service can never delete a stale rebook target. Best-effort: the
			// new booking already succeeded, so a delete failure is swallowed, and the
			// token is consumed exactly once (cleared in finally).
			try {
				const raw = sessionStorage.getItem('pendingRebook');
				if (raw) {
					const pending = JSON.parse(raw);
					if (pending?.bookingId && pending.nonce && pending.nonce === rebookNonce) {
						try {
							await confirmData.deleteBooking(pending.bookingId);
						} catch {
							// swallow — new booking is confirmed; stale old booking self-corrects
						}
					}
				}
			} catch {
				// sessionStorage unavailable — nothing to consume
			} finally {
				try {
					sessionStorage.removeItem('pendingRebook');
				} catch {
					// ignore
				}
			}
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
			const params = new URLSearchParams();
			if (employeeName) params.set('employee', employeeName);
			if (locationName) params.set('location', locationName);
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamic query string appended to a fixed path; resolve() covers the bare path only
			goto(`${resolve('/book/done')}?${params.toString()}`);
		} catch (err) {
			if (err.status === 409) {
				const dateStr = startDate ? DateUtils.toLocalDate(startDate) : '';
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamic path segment combined with a query string
				goto(`/book/${serviceId}/conflict?date=${dateStr}`);
			} else {
				bookError = apiErrorMessage(err);
			}
		} finally {
			bookLoading = false;
		}
	}

	let heading = $state();
	$effect(() => {
		auth.isLoggedIn;
		linkValid;
		heading?.focus();
	});

	// "12 September" — matches the day format used in the booking wizard's
	// own breadcrumb and Prev/Next hover text (see `targetDayLabel` in
	// `book/[serviceId]/+page.svelte`); one date format across the whole
	// wizard, per the spec's explicit call-out (A10).
	const breadcrumbItems = $derived.by(() => {
		const items = [];
		if (service) items.push(service.name);
		if (locationName) items.push(locationName);
		if (employeeName) items.push(employeeName);
		if (startDate) items.push(`${startDate.getDate()} ${startDate.toLocaleDateString(getLocale(), { month: 'long' })}`);
		if (startDate) items.push(DateUtils.toLocalTime(startDate));
		return items;
	});
</script>

<BookingSummary items={breadcrumbItems} />

<button
	type="button"
	onclick={() => history.back()}
	class="text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline mb-4"
>
	{m.back()}
</button>

{#if !linkValid}
	<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-4 outline-none">{m.bookingLinkInvalid()}</h1>
	<p class="text-gray-600 mb-4">{m.bookingLinkInvalidMessage()}</p>
	<a
		href={resolve(`/book/${serviceId}`)}
		class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
	>
		{m.chooseATime()}
	</a>
{:else if !auth.isLoggedIn}
	<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-2 outline-none">{m.signInOrSignUp()}</h1>
	<p class="text-sm text-gray-600 mb-6">
		{m.timeNotHeld()}
	</p>

	{#if authMode === 'login'}
		<Form legend={m.signIn()} error={authError} loading={authLoading} onsubmit={handleLogin} submitLabel={m.signIn()}>
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">{m.labelEmailAddress()}</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">{m.labelPassword()}</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				/>
			</div>
		</Form>
		<p class="mt-4 text-sm text-gray-600">
			<a
				href={resolve('/change-password')}
				class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
			>
				{m.forgotPassword()}
			</a>
		</p>
		<p class="mt-4 text-sm text-gray-600">
			{m.newHere()}
			<button
				type="button"
				onclick={switchToSignUp}
				class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
			>
				{m.createAnAccount()}
			</button>
		</p>
	{:else if !signUpSent}
		<Form legend={m.signUp()} error={authError} loading={authLoading} onsubmit={handleSignUp} submitLabel={m.signUp()}>
			<div>
				<label for="signupEmail" class="block text-sm font-medium text-gray-700 mb-1">{m.labelEmailAddress()}</label>
				<input
					id="signupEmail"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				/>
			</div>
			<div class="flex items-start gap-2">
				<input id="acceptTerms" name="acceptTerms" type="checkbox" required bind:checked={acceptTerms} class="mt-1" />
				<label for="acceptTerms" class="text-sm text-gray-700">
					{m.iAcceptThe()}
					<a
						href={resolve('/terms-and-conditions')}
						target="_blank"
						rel="noopener"
						class="text-indigo-600 hover:text-indigo-500 underline"
					>
						{m.termsAndConditionsLink()}
					</a>.
				</label>
			</div>
		</Form>
		<p class="mt-4 text-sm text-gray-600">
			{m.alreadyHaveAccount()}
			<button
				type="button"
				onclick={switchToLogin}
				class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
			>
				{m.signIn()}
			</button>
		</p>
	{:else}
		<div role="status" class="rounded-md bg-green-50 p-4 mb-4">
			<p class="text-sm text-green-800">
				{m.activationSent({ email })}
			</p>
		</div>
		<button
			type="button"
			onclick={switchToLogin}
			class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
		>
			{m.signIn()}
		</button>
	{/if}
{:else}
	<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold mb-6 outline-none">{m.confirmAppointment()}</h1>

	{#if vacancyError}
		<p class="text-red-600">{vacancyError}</p>
	{:else if !vacancy || !service}
		<div role="status" aria-live="polite"><p>{m.loading()}</p></div>
	{:else}
		<dl class="space-y-2 text-sm mb-6">
			<div>
				<dt class="font-medium text-gray-700">{m.labelService()}</dt>
				<dd class="text-gray-600">{service.name} ({DateUtils.formatDuration(service.duration)})</dd>
			</div>
			<div>
				<dt class="font-medium text-gray-700">{m.labelDate()}</dt>
				<dd class="text-gray-600">{DateUtils.toLocalDate(startDate)}</dd>
			</div>
			<div>
				<dt class="font-medium text-gray-700">{m.labelTime()}</dt>
				<dd class="text-gray-600">
					{DateUtils.toLocalTime(startDate)} – {endDate ? DateUtils.toLocalTime(endDate) : ''}
				</dd>
			</div>
			<div>
				<dt class="font-medium text-gray-700">{m.labelLocation()}</dt>
				<dd class="text-gray-600">{locationName}</dd>
			</div>
			<div>
				<dt class="font-medium text-gray-700">{m.labelEmployee()}</dt>
				<dd class="text-gray-600">{employeeName}</dd>
			</div>
		</dl>

		<Form
			legend={m.confirmAppointment()}
			error={bookError}
			loading={bookLoading}
			onsubmit={handleBook}
			submitLabel={m.bookNow()}
			submitDisabled={!acceptCancellation}
		>
			<div>
				<div class="flex items-start gap-2">
					<input
						id="acceptCancellation"
						name="acceptCancellation"
						type="checkbox"
						bind:checked={acceptCancellation}
						aria-describedby={cancellationError ? 'acceptCancellationError' : undefined}
						class="mt-1"
					/>
					<label for="acceptCancellation" class="text-sm text-gray-700">
						{m.cancellationPolicyLabel()}
						<a
							href={resolve('/terms-and-conditions')}
							target="_blank"
							rel="noopener"
							class="text-indigo-600 hover:text-indigo-500 underline"
						>
							{m.termsAndConditionsLink()}
						</a>.
					</label>
				</div>
				{#if cancellationError}
					<p id="acceptCancellationError" class="text-sm text-red-600 mt-1">{cancellationError}</p>
				{/if}
			</div>
			<LimitedTextarea id="notes" label={m.notesForEmployeeOptional()} bind:value={notes} />
		</Form>
	{/if}
{/if}
