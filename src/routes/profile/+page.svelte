<script>
	import { auth, Form, apiErrorMessage, ListCalendar } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useProfileData } from './profileData.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

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
			goto(resolve('/login?returnUrl=/profile'));
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
		// Rescheduling is wired up in a follow-up; the booking id is event.id.
		void event;
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
				<p>{m.loading()}</p>
			</div>
		{:else if profile.error}
			<div role="alert" aria-live="assertive">
				<p class="text-red-600">{apiErrorMessage(profile.error)}</p>
			</div>
		{:else}
			<h1 class="sr-only">{m.titleMyProfile()}</h1>

			<!-- Calendar takes the remaining width on the left; the profile form is a
			     fixed narrower pane on the right. Stacks (calendar first) on mobile. -->
			<div class="flex flex-col gap-12 lg:flex-row lg:gap-16">
				<!-- Section 1: Bookings List Calendar -->
				<section class="min-w-0 flex-1" aria-labelledby="bookings-heading">
					<h2 id="bookings-heading" class="text-2xl font-bold mb-4">{m.myBookings()}</h2>
					{#if bookingMessage}
						<div role="status" aria-live="polite" class="rounded-md bg-green-50 p-4 mb-4">
							<p class="text-sm text-green-800">{bookingMessage}</p>
						</div>
					{/if}
					{#if bookingError}
						<div role="alert" aria-live="assertive" class="rounded-md bg-red-50 p-4 mb-4">
							<p class="text-sm text-red-700">{bookingError}</p>
						</div>
					{/if}
					<ListCalendar
						events={profile.bookingEvents}
						onBookNew={handleBookNew}
						onMoveEvent={handleMoveEvent}
						onCancelEvent={handleCancelEvent}
					/>
				</section>

				<!-- Section 2: Profile Information Form (fixed narrower pane) -->
				<section class="lg:w-80 lg:shrink-0" aria-labelledby="profile-heading">
					<h2 id="profile-heading" class="text-2xl font-bold mb-4">{m.legendEditProfile()}</h2>
					<div>
						<!-- Success message -->
						{#if successMessage}
							<div role="status" aria-live="polite" class="rounded-md bg-green-50 p-4 mb-4">
								<p class="text-sm text-green-800">{successMessage}</p>
							</div>
						{/if}

						<Form legend={m.legendEditProfile()} {error} {loading} submitLabel={m.update()} onsubmit={handleSubmit}>
							<!-- Email: read-only display -->
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelEmail()} </label>
								<input
									id="email"
									name="email"
									type="email"
									disabled
									bind:value={email}
									class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed sm:text-sm"
									title={m.emailCannotBeChanged()}
								/>
							</div>

							<!-- Name: editable -->
							<div>
								<label for="name" class="block text-sm font-medium text-gray-700 mb-1"> {m.labelName()} </label>
								<input
									id="name"
									name="name"
									type="text"
									required
									bind:value={name}
									class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								/>
							</div>

							<!-- Phone: editable -->
							<div>
								<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">{m.labelPhone()}</label>
								<div class="relative">
									<span
										aria-hidden="true"
										class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 sm:text-sm"
										>+</span
									>
									<input
										id="phone"
										name="phone"
										type="tel"
										required
										pattern={'(3[0-46]|39|4[013-9])[0-9]{8}|(35[1-46-9]|37[0-2]|38[56]|42[01])[0-9]{7}'}
										title={m.phoneValidation()}
										placeholder={m.phonePlaceholder()}
										bind:value={phone}
										class="block w-full px-3 py-2 pl-5 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									/>
								</div>
							</div>
						</Form>
					</div>
				</section>
			</div>
		{/if}
	</div>
{/if}
