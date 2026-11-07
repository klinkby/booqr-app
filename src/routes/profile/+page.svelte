<script>
	import { auth, ContactFields, Form, apiError, ErrorMessage } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { useProfileData } from './profileData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { alert, cardSection, input, label, link, sectionHeading, success } from '#lib/ui.js';
	import { takeoutFileName } from './takeout.js';

	// Lazy-load the calendar (and its heavy `@event-calendar/core` dependency) so it
	// splits into its own chunk instead of the shared bundle. Import the component's
	// own module directly — not the `#lib` barrel — or the bundler can't split it out.
	let ListCalendar = $state(null);
	onMount(async () => {
		ListCalendar = (await import('#lib/components/ListCalendar.svelte')).default;
	});

	const profile = useProfileData();

	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let error = $state(null);
	let loading = $state(false);
	let initialized = $state(false);
	let successMessage = $state(null);
	let bookingError = $state(null);
	let bookingMessage = $state(null);
	let cancelling = $state(false);
	let exporting = $state(false);
	let exportError = $state(null);

	// Auth guard: redirect unauthenticated users
	$effect(() => {
		if (!auth.isLoggedIn) {
			goto(resolve('login?returnUrl=/profile'));
		}
	});

	// Populate form fields once when cached (or freshly fetched) data arrives.
	// Guard prevents re-initialising if the mutation triggers a background refetch.
	$effect(() => {
		if (profile.user && !initialized) {
			name = profile.user.name || '';
			phone = profile.user.phone || '';
			email = profile.user.email;
			initialized = true;
		}
	});

	async function handleSubmit() {
		error = null;
		successMessage = null;
		loading = true;
		try {
			await profile.saveProfile({ name, phone });
			successMessage = m.profileUpdated();
		} catch (err) {
			error = apiError(err);
		} finally {
			loading = false;
		}
	}

	function handleBookNew() {
		goto(resolve('/'));
	}

	function handleMoveEvent(event) {
		const { serviceId, employeeId, locationId } = event.extendedProps;
		// Bind the rebook intent to a one-time nonce carried both in sessionStorage
		// and in the wizard URL. The old booking is deleted on completion only when
		// the two match, so an unrelated booking for the same service (started from
		// any URL without this nonce) can never consume a stale token.
		const nonce = crypto.randomUUID();
		try {
			sessionStorage.setItem('pendingRebook', JSON.stringify({ bookingId: event.id, nonce }));
		} catch {
			// sessionStorage unavailable — nothing to store
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams();
		params.set('employee', employeeId);
		params.set('location', locationId);
		params.set('rebook', nonce);

		goto(resolve(`book/${serviceId}?${params.toString()}`));
	}

	function handleDuplicateEvent(event) {
		const { serviceId, employeeId, locationId } = event.extendedProps;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams();
		params.set('employee', employeeId);
		params.set('location', locationId);

		goto(resolve(`book/${serviceId}?${params.toString()}`));
	}

	async function handleCancelEvent(event) {
		// ListCalendar fires this without awaiting and closes its menu immediately,
		// so guard against a second cancel landing before the first settles.
		if (cancelling) return;
		cancelling = true;
		bookingError = null;
		bookingMessage = null;
		try {
			await profile.cancelBooking(event.id);
			bookingMessage = m.bookingCancelled();
		} catch (err) {
			bookingError = apiError(err);
		} finally {
			cancelling = false;
		}
	}

	// GDPR takeout: fetch the user's own data document and hand it to the browser
	// as a JSON file download. The object URL is revoked right after the click so
	// the PII doesn't linger in memory.
	async function handleExport() {
		if (exporting) return;
		exporting = true;
		exportError = null;
		try {
			const doc = await profile.exportMyTakeout();
			const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = takeoutFileName(doc);
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			exportError = apiError(err);
		} finally {
			exporting = false;
		}
	}
</script>

{#if auth.isLoggedIn}
	<div>
		{#if profile.isLoading}
			<div role="status" aria-live="polite">
				<p class="text-sm text-gray-500">{m.loading()}</p>
			</div>
		{:else if profile.error}
			<div role="alert" aria-live="assertive" class={alert}>
				<ErrorMessage error={apiError(profile.error)} />
			</div>
		{:else}
			<!-- Calendar takes the remaining width on the left; the profile form is a
			     fixed narrower pane on the right. Stacks (calendar first) on mobile. -->
			<div class="flex flex-col gap-6 lg:flex-row lg:gap-16">
				<!-- Section 1: Bookings List Calendar -->
				<section class="min-w-0 flex-1" aria-labelledby="bookings-heading">
					<h2 id="bookings-heading" class="{sectionHeading} mb-4">{m.myBookings()}</h2>
					{#if bookingMessage}
						<div role="status" aria-live="polite" class="{success} mb-4">{bookingMessage}</div>
					{/if}
					{#if bookingError}
						<div role="alert" aria-live="assertive" class="{alert} mb-4"><ErrorMessage error={bookingError} /></div>
					{/if}
					{#if ListCalendar}
						<ListCalendar
							events={profile.bookingEvents}
							onBookNew={handleBookNew}
							onMoveEvent={handleMoveEvent}
							onCancelEvent={handleCancelEvent}
							onDuplicateEvent={handleDuplicateEvent}
						/>
					{:else}
						<p role="status" class="p-4 text-sm text-gray-500">{m.loading()}</p>
					{/if}
				</section>

				<!-- Section 2: Profile Information Form (fixed narrower pane) -->
				<section class="lg:w-80 lg:shrink-0" aria-labelledby="profile-heading">
					<h2 id="profile-heading" class="{sectionHeading} mb-4">{m.legendEditProfile()}</h2>
					<div>
						<!-- Success message -->
						{#if successMessage}
							<div role="status" aria-live="polite" class="{success} mb-4">{successMessage}</div>
						{/if}

						<Form
							card
							legend={m.legendEditProfile()}
							{error}
							{loading}
							submitLabel={m.update()}
							onsubmit={handleSubmit}
						>
							<div class="{cardSection} space-y-4">
								<ContactFields bind:name bind:phone>
									<!-- Email: read-only display -->
									<div>
										<label for="email" class={label}> {m.labelEmail()} </label>
										<input
											id="email"
											name="email"
											type="email"
											disabled
											bind:value={email}
											class={input}
											title={m.emailCannotBeChanged()}
										/>
									</div>
								</ContactFields>
							</div>
						</Form>

						{#if exportError}
							<div role="alert" aria-live="assertive" class="{alert} mt-4"><ErrorMessage error={exportError} /></div>
						{/if}
						<!-- Inset by the card's own padding so the line aligns with the fields
						     above. It's an action, so the link-styled word is a <button>; the
						     rest of the sentence describes it for assistive tech. -->
						<p class="{cardSection} flex items-center gap-1 text-sm text-gray-500">
							<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path
									d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								></path>
							</svg>
							<button
								type="button"
								class="{link} disabled:opacity-50"
								onclick={handleExport}
								disabled={exporting}
								aria-busy={exporting}
								aria-describedby="export-my-data-rest"
							>
								{m.exportMyDataLink()}
							</button>
							<span id="export-my-data-rest">{m.exportMyDataRest()}</span>
						</p>
					</div>
				</section>
			</div>
		{/if}
	</div>
{/if}
