<script>
	import { Calendar, List } from '@event-calendar/core';
	import './calendar.css';
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { calendarTheme } from '#lib/ui.js';
	import BookingMenu from './BookingMenu.svelte';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let {
		events = [],
		onEventClick = undefined,
		onDatesChange = undefined,
		onBookNew = undefined,
		onMoveEvent = undefined,
		onCancelEvent = undefined,
		onDuplicateEvent = undefined,
	} = $props();

	let cal;
	let hasEvents = $derived(events.length > 0);

	// Constrain year paging to the span of years that actually contain bookings:
	// validRange from the first booking's year-start to the last booking's
	// year-end. The library then natively disables prev/next at the boundaries
	// (a real `disabled` attribute), so you can't page into empty years.
	let validRange = $derived.by(() => {
		if (events.length === 0) return {};
		const times = events.map((e) => new Date(e.start).getFullYear());
		const minYear = Math.min(...times);
		const maxYear = Math.max(...times);
		// end is the last day *inside* the last booking year (Dec 31), not Jan 1
		// of the following year: the library disables `next` only when every day
		// of the year it would page to falls strictly after validRange.end, so
		// end must sit within maxYear, otherwise stepping to maxYear+1 still has
		// its Jan 1 == end (not "outside") and next stays enabled.
		return { start: new Date(minYear, 0, 1), end: new Date(maxYear, 11, 31) };
	});

	$effect(() => {
		if (cal) cal.setOption('events', events);
	});

	$effect(() => {
		if (cal) cal.setOption('validRange', validRange);
	});

	// On initial load, skip to the year of the first upcoming booking so the
	// customer sees it straight away instead of a "no bookings" empty state.
	let initialSkipDone = false;
	$effect(() => {
		if (!cal || !hasEvents || initialSkipDone) return;
		initialSkipDone = true;
		const now = new Date();
		const upcoming = events
			.map((e) => new Date(e.start))
			.filter((d) => d >= now)
			.sort((a, b) => a - b);
		if (upcoming.length > 0 && upcoming[0].getFullYear() !== now.getFullYear()) {
			cal.gotoDate(upcoming[0]);
		}
	});

	// Read once at init: switching language reloads the SPA (see AGENTS.md), so
	// the locale never changes within a component instance's lifetime.
	const locale = getLocale();
	// Danish (and the rest of the app's date formatting) uses 24-hour time;
	// English uses 12-hour. Drive it explicitly off the locale rather than
	// relying on the library's per-locale default.
	const hour12 = locale !== 'da';

	const options = {
		// listYear lists every booking across the whole year in one scrolling
		// list (so all months with bookings show at once). Prev/next page by
		// year so bookings in an adjacent year (e.g. early January viewed from
		// December) stay reachable; validRange caps paging to the years that
		// actually hold bookings.
		view: 'listYear',
		theme: calendarTheme,
		// Seed the initial validRange only; the $effect above reactively pushes
		// later values via setOption. untrack marks the one-time read as deliberate
		// (this whole `options` object is built once, at construction).
		validRange: untrack(() => validRange),
		firstDay: 1,
		// Localizes day/month names in the list day headers and the title.
		locale,
		// Event time (the timeText shown in each row) honours the locale's clock.
		eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12 },
		// Day-group header date. Drop the year (library default includes it) —
		// the listYear title already names the year, so repeating it on every
		// day row is redundant. e.g. "1. September" instead of "September 1, 2026".
		listDaySideFormat: { month: 'long', day: 'numeric' },
		headerToolbar: {
			// Title (the year) left-aligned, then the prev/next arrows; bookNew
			// stays on the right. The empty center keeps the toolbar's
			// space-between layout so bookNew hugs the right edge.
			start: 'title prev,next',
			center: '',
			end: 'bookNew',
		},
		customButtons: {
			bookNew: {
				text: m.bookNewAppointment(),
				click: () => onBookNew?.(),
			},
		},
		buttonText: {
			prev: m.calendarPreviousYear(),
			next: m.calendarNextYear(),
		},
		datesSet: (info) => onDatesChange?.(info),
		// Only register eventClick when a consumer actually wants row clicks: the
		// library stamps role="button" on every event row whenever *any* onclick
		// handler is present, so an always-on `() => onEventClick?.()` would make the
		// rows falsely interactive (and nest the kebab <button> inside a
		// role="button") even on the profile page, which passes no handler. The
		// presence check is a one-time decision at construction (untrack), and the
		// handler is invoked lazily so it always calls the current prop.
		...(untrack(() => !!onEventClick) && { eventClick: (info) => onEventClick(info) }),
		// Localized empty state (the library's own default is untranslated).
		noEventsContent: () => m.noBookings(),
	};
</script>

<div class="list-calendar">
	<Calendar bind:this={cal} {options} plugins={[List]} {eventContent} />
</div>

{#snippet eventContent(info)}
	<!-- A custom eventContent snippet replaces the library's default
	     time+title rendering. The line reads, e.g.:
	       **10.00 - 11.10 Zonetheremin** (Mads) @ Gunløgsgade 3
	     — the time range and service name bold, then the employee in parens and
	     the location after "@". Parts come from event.extendedProps (see
	     profileData). Plus the trailing overflow-menu trigger. -->
	<div class="flex flex-1 items-center justify-between gap-2">
		<span class="flex flex-wrap items-baseline gap-x-1">
			<span class="font-bold">
				{#if info.timeText}<time class="ec-event-time">{info.timeText}</time>{/if}
				{info.event.extendedProps.serviceName}
			</span>
			<span>({info.event.extendedProps.employeeName})</span>
			<span>@ {info.event.extendedProps.locationName}</span>
		</span>
		<!-- Overflow menu: justify-between pushes it to the row's right padding edge,
		     aligning the ⋮ with the date shown in the day header above. Always shown
		     (every booking can be duplicated); `manageable` (decided by profileData)
		     adds Reschedule and Cancel booking. -->
		<BookingMenu
			id={info.event.id}
			manageable={info.event.extendedProps.manageable}
			onduplicate={() => onDuplicateEvent?.(info.event)}
			onreschedule={() => onMoveEvent?.(info.event)}
			oncancelbooking={() => onCancelEvent?.(info.event)}
		/>
	</div>
{/snippet}

<style>
	/* Keep the "Book" custom toolbar button primary: the calendar theme makes all
	   buttons secondary. Colours match buttonPrimary. The theme's secondary ring
	   (--tw-ring-shadow) is zeroed; the shadow is kept. */
	.list-calendar :global(.ec-button.ec-bookNew) {
		background-color: var(--color-indigo-600);
		border-color: transparent;
		color: #fff;
		--tw-ring-shadow: 0 0 #0000;
	}
	.list-calendar :global(.ec-button.ec-bookNew:hover) {
		background-color: var(--color-indigo-500);
	}

	/* Hide prev/next entirely at the year-paging boundaries rather than showing
	   a greyed-out control. The library toggles the `disabled` attribute (via
	   validRange), so this reacts automatically as the visible year changes. */
	.list-calendar :global(.ec-button.ec-prev:disabled),
	.list-calendar :global(.ec-button.ec-next:disabled) {
		display: none;
	}

	/* Vertically centre the year against the prev/next buttons. The toolbar's
	   start slot (title + buttons) defaults to align-items: normal, which top-
	   aligns the short title text next to the taller buttons; center evens them. */
	.list-calendar :global(.ec-toolbar .ec-start) {
		align-items: center;
	}

	/* Capitalize the weekday in the day-group header. Intl renders weekday names
	   lowercase in Danish ("mandag"); this lifts the first letter. Targets the
	   weekday <time> (the day-head child that is not the .ec-day-side date). */
	.list-calendar :global(.ec-day-head > time:not(.ec-day-side)) {
		text-transform: capitalize;
	}

	/* Hide the per-event colour tag the list view prepends to each row. We don't
	   colour-code bookings, and its 4px width + 8px margin pushed the booking
	   line to the right of the day-group header. */
	.list-calendar :global(.ec-event .ec-event-tag) {
		display: none;
	}

	/* Align the booking line's left edge with the day-group header above it.
	   Both use 1.5em left padding, but the event row's font-size is .85em, so
	   its 1.5em resolves ~3.6px narrower than the header's — leaving the booking
	   text slightly left of the header. Pin the event's left padding to 1.5rem
	   (root-relative, matching the header's 24px) so they line up exactly. */
	.list-calendar :global(.ec-list .ec-event) {
		padding-left: 1.5rem;
	}

	/* Let a row's overflow menu escape the list container. The library gives
	   .ec-main `overflow: auto` as a scroll boundary, which would clip the
	   absolutely-positioned popup — most visibly on the last row, whose menu
	   opens downward past the container's bottom edge. The listYear view grows
	   with its content (no fixed height here), so it never actually scrolls,
	   making `visible` safe: nothing is hidden that the user needed to scroll to. */
	.list-calendar :global(.ec-main) {
		overflow: visible;
	}

	/* Lift the row whose overflow menu is open above its siblings. The library
	   gives every list row `.ec-event { position: relative; z-index: 1 }` and each
	   day header `z-index: 2`, so those form stacking contexts that paint over an
	   absolutely-positioned popup living inside an *earlier* row — the menu's own
	   z-index only ranks it within its own row. Raising the owning row's z-index
	   (via :has on the open menu) puts the whole row, popup included, on top. */
	.list-calendar :global(.ec-list .ec-event:has([role='menu'])) {
		z-index: 3;
	}
</style>
