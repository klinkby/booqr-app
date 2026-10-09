<script>
	import { BookingSummary, Form, LimitedTextarea, MARKETING_URL, RequiredInput, apiErrorMessage, auth } from '#lib';
	import { alert, card, cardSection, checkbox, choiceLabel, label, link, pageHeading, success } from '#lib/ui.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { DateUtils } from '#lib/dateUtils.js';
	import { onMount } from 'svelte';
	import { useConfirmData } from './confirmData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

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
	// Same long format as the wizard's day heading.
	const dateLabel = $derived(
		startDate
			? `${startDate.getDate()}. ${startDate.toLocaleDateString(getLocale(), { month: 'long' })} ${startDate.getFullYear()}`
			: '',
	);

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

			goto(`${resolve('book/done')}?${params.toString()}`);
		} catch (err) {
			if (err.status === 409) {
				const dateStr = startDate ? DateUtils.toLocalDate(startDate) : '';

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

<button type="button" onclick={() => history.back()} class="{link} mb-4 text-sm">
	{m.back()}
</button>

{#if !linkValid}
	<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-6 outline-none">{m.bookingLinkInvalid()}</h1>
	<p class="mb-4 text-sm text-gray-500">{m.bookingLinkInvalidMessage()}</p>
	<a href={resolve(`book/${serviceId}`)} class="{link} text-sm">
		{m.chooseATime()}
	</a>
{:else if !auth.isLoggedIn}
	<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-2 outline-none">{m.signInOrSignUp()}</h1>

	<p class="mb-6 text-sm text-gray-500">{m.timeNotHeld()}</p>

	{#if authMode === 'login'}
		<Form
			card
			legend={m.signIn()}
			error={authError}
			loading={authLoading}
			onsubmit={handleLogin}
			submitLabel={m.signIn()}
		>
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
		<p class="mt-6 text-center text-sm text-gray-500">
			{m.newHere()} <button type="button" onclick={switchToSignUp} class={link}>{m.createAnAccount()}</button>
		</p>
	{:else if !signUpSent}
		<Form
			card
			legend={m.signUp()}
			error={authError}
			loading={authLoading}
			onsubmit={handleSignUp}
			submitLabel={m.signUp()}
		>
			<div class="{cardSection} space-y-4">
				<div>
					<label for="signupEmail" class={label}>{m.labelEmailAddress()}</label>
					<RequiredInput
						id="signupEmail"
						name="email"
						type="email"
						autocomplete="email"
						placeholder={m.labelEmailAddress()}
						bind:value={email}
					/>
				</div>
				<div class="flex items-start gap-3">
					<input
						id="acceptTerms"
						name="acceptTerms"
						type="checkbox"
						required
						bind:checked={acceptTerms}
						class="{checkbox} mt-0.5"
					/>
					<label for="acceptTerms" class={choiceLabel}>
						{m.iAcceptThe()}
						<a href="{MARKETING_URL}/terms" target="_blank" rel="noopener" class={link}>
							{m.termsAndConditionsLink()}
						</a>.
					</label>
				</div>
			</div>
		</Form>
		<p class="mt-6 text-center text-sm text-gray-500">
			{m.alreadyHaveAccount()} <button type="button" onclick={switchToLogin} class={link}>{m.signIn()}</button>
		</p>
	{:else}
		<div role="status" class="{success} mb-4">{m.activationSent({ email })}</div>
		<p class="mt-6 text-center text-sm">
			<button type="button" onclick={switchToLogin} class={link}>{m.signIn()}</button>
		</p>
	{/if}
{:else}
	<h1 bind:this={heading} tabindex="-1" class="{pageHeading} mb-6 outline-none">{m.confirmAppointment()}</h1>

	{#if vacancyError}
		<p role="alert" class={alert}>{vacancyError}</p>
	{:else if !vacancy || !service}
		<p role="status" aria-live="polite" class="text-sm text-gray-500">{m.loading()}</p>
	{:else}
		<dl class="{card} mb-6 divide-y divide-gray-100">
			<div class="grid grid-cols-3 gap-4 px-4 py-3 sm:px-6">
				<dt class="text-sm font-semibold text-gray-900">{m.labelService()}</dt>
				<dd class="col-span-2 text-sm text-gray-700">{service.name} ({DateUtils.formatDuration(service.duration)})</dd>
			</div>
			<div class="grid grid-cols-3 gap-4 px-4 py-3 sm:px-6">
				<dt class="text-sm font-semibold text-gray-900">{m.labelDate()}</dt>
				<dd class="col-span-2 text-sm text-gray-700">{dateLabel}</dd>
			</div>
			<div class="grid grid-cols-3 gap-4 px-4 py-3 sm:px-6">
				<dt class="text-sm font-semibold text-gray-900">{m.labelTime()}</dt>
				<dd class="col-span-2 text-sm text-gray-700">
					{DateUtils.toLocalTime(startDate)} – {endDate ? DateUtils.toLocalTime(endDate) : ''}
				</dd>
			</div>
			<div class="grid grid-cols-3 gap-4 px-4 py-3 sm:px-6">
				<dt class="text-sm font-semibold text-gray-900">{m.labelLocation()}</dt>
				<dd class="col-span-2 text-sm text-gray-700">{locationName}</dd>
			</div>
			<div class="grid grid-cols-3 gap-4 px-4 py-3 sm:px-6">
				<dt class="text-sm font-semibold text-gray-900">{m.labelEmployee()}</dt>
				<dd class="col-span-2 text-sm text-gray-700">{employeeName}</dd>
			</div>
		</dl>

		<Form
			card
			legend={m.confirmAppointment()}
			error={bookError}
			loading={bookLoading}
			onsubmit={handleBook}
			submitLabel={m.bookNow()}
			submitDisabled={!acceptCancellation}
		>
			<div class="{cardSection} space-y-4">
				<div>
					<div class="flex items-start gap-3">
						<input
							id="acceptCancellation"
							name="acceptCancellation"
							type="checkbox"
							bind:checked={acceptCancellation}
							aria-describedby={cancellationError ? 'acceptCancellationError' : undefined}
							class="{checkbox} mt-0.5"
						/>
						<label for="acceptCancellation" class={choiceLabel}>
							{m.cancellationPolicyLabel()}
							<a href="{MARKETING_URL}/terms" target="_blank" rel="noopener" class={link}>
								{m.termsAndConditionsLink()}
							</a>.
						</label>
					</div>
					{#if cancellationError}
						<p id="acceptCancellationError" class="mt-2 text-sm text-red-700">{cancellationError}</p>
					{/if}
				</div>
				<LimitedTextarea id="notes" label={m.notesForEmployeeOptional()} bind:value={notes} />
			</div>
		</Form>
	{/if}
{/if}
