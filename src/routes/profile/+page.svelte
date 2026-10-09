<script>
	import { auth, Form, apiErrorMessage, PhoneInput, RequiredInput } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { useProfileData } from './profileData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { alert, cardSection, input, label, sectionHeading, success } from '#lib/ui.js';

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
			error = apiErrorMessage(err);
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

		goto(`/book/${serviceId}?${params.toString()}`);
	}

	function handleDuplicateEvent(event) {
		const { serviceId, employeeId, locationId } = event.extendedProps;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams();
		params.set('employee', employeeId);
		params.set('location', locationId);

		goto(`/book/${serviceId}?${params.toString()}`);
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
			bookingError = apiErrorMessage(err);
		} finally {
			cancelling = false;
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
				{apiErrorMessage(profile.error)}
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
						<div role="alert" aria-live="assertive" class="{alert} mb-4">{bookingError}</div>
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

								<!-- Name: editable -->
								<div>
									<label for="name" class={label}> {m.labelName()} </label>
									<RequiredInput id="name" name="name" type="text" bind:value={name} />
								</div>

								<PhoneInput bind:value={phone} />
							</div>
						</Form>
					</div>
				</section>
			</div>
		{/if}
	</div>
{/if}
