<script>
	import { ErrorMessage, apiError } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { useContactBookingsData } from './bookingsData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { alert, sectionHeading, success } from '#lib/ui.js';
	import { duplicateBookingPath, rescheduleBookingPath } from '#lib/bookingWizard.js';

	// Lazy-load the calendar (and its heavy `@event-calendar/core` dependency) so it
	// splits into its own chunk instead of the shared bundle. Import the component's
	// own module directly — not the `#lib` barrel — or the bundler can't split it out.
	let ListCalendar = $state(null);
	onMount(async () => {
		ListCalendar = (await import('#lib/components/ListCalendar.svelte')).default;
	});

	const data = useContactBookingsData();

	let id = $derived(page.params.id);
	let bookingError = $state(null);
	let bookingMessage = $state(null);
	let cancelling = $state(false);

	// Book on the contact's behalf: the wizard honours `?customer=` for employees.
	function handleBookNew() {
		goto(resolve(`/?customer=${encodeURIComponent(id)}`));
	}

	function handleMoveEvent(event) {
		goto(resolve(rescheduleBookingPath({ id: event.id, ...event.extendedProps, customerId: id })));
	}

	function handleDuplicateEvent(event) {
		goto(resolve(duplicateBookingPath({ ...event.extendedProps, customerId: id })));
	}

	async function handleCancelEvent(event) {
		// ListCalendar fires this without awaiting and closes its menu immediately,
		// so guard against a second cancel landing before the first settles.
		if (cancelling) return;
		cancelling = true;
		bookingError = null;
		bookingMessage = null;
		try {
			await data.cancelBooking(event.id);
			bookingMessage = m.bookingCancelled();
		} catch (err) {
			bookingError = apiError(err);
		} finally {
			cancelling = false;
		}
	}
</script>

<div>
	{#if data.isLoading}
		<div role="status" aria-live="polite">
			<p class="text-sm text-gray-500">{m.loading()}</p>
		</div>
	{:else if data.error}
		<div role="alert" aria-live="assertive" class={alert}>
			<ErrorMessage error={apiError(data.error)} />
		</div>
	{:else}
		<section class="min-w-0" aria-labelledby="contact-bookings-heading">
			<h2 id="contact-bookings-heading" class="{sectionHeading} mb-4">{data.contactName}</h2>
			{#if bookingMessage}
				<div role="status" aria-live="polite" class="{success} mb-4">{bookingMessage}</div>
			{/if}
			{#if bookingError}
				<div role="alert" aria-live="assertive" class="{alert} mb-4"><ErrorMessage error={bookingError} /></div>
			{/if}
			{#if ListCalendar}
				<ListCalendar
					events={data.bookingEvents}
					emptyMessage={m.noItemsFound()}
					onBookNew={handleBookNew}
					onMoveEvent={handleMoveEvent}
					onCancelEvent={handleCancelEvent}
					onDuplicateEvent={handleDuplicateEvent}
				/>
			{:else}
				<p role="status" class="p-4 text-sm text-gray-500">{m.loading()}</p>
			{/if}
		</section>
	{/if}
</div>
