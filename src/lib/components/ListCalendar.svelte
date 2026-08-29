<script>
	import { Calendar, List } from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let {
		events = [],
		onEventClick = undefined,
		onDatesChange = undefined,
		onBookNew = undefined,
		onMoveEvent = undefined,
		onCancelEvent = undefined,
	} = $props();

	// Overflow-menu open state: hold the info.event.id of the row whose menu is
	// open (the eventContent snippet is instanced per row inside the calendar's
	// DOM, so a single boolean can't distinguish rows). null = all closed.
	let openMenuId = $state(null);
	let menuTriggerEl; // the ⋮ button of the open row, for focus return on close

	function toggleMenu(id, triggerEl) {
		if (openMenuId === id) {
			openMenuId = null;
		} else {
			openMenuId = id;
			menuTriggerEl = triggerEl;
		}
	}
	function closeMenu(returnFocus = false) {
		openMenuId = null;
		if (returnFocus && menuTriggerEl) menuTriggerEl.focus();
	}

	// Move focus to the first menuitem when the popup opens, so a keyboard user
	// who activated the trigger lands inside the menu (standard ARIA-menu
	// behaviour) instead of having to Tab into it. Runs on mount of the panel.
	function focusFirst(node) {
		node.querySelector('[role="menuitem"]')?.focus();
	}

	// Escape closes the open menu and returns focus to its trigger. Bound to the
	// interactive controls themselves (trigger + menu items) rather than the
	// role="menu" container, which would then be flagged as needing a tabindex.
	function onMenuKeydown(e, id) {
		if (e.key === 'Escape' && openMenuId === id) {
			e.stopPropagation();
			closeMenu(true);
		}
	}

	// Bookings starting within 24 hours can no longer be rescheduled or
	// cancelled, so the whole overflow menu is hidden for them (this also covers
	// events already in the past). The library resolves `event.start` back to the
	// booking's true instant (verified: it round-trips to the original UTC the API
	// sent, offset applied), so comparing its epoch to Date.now() is correct
	// regardless of the viewer's timezone. A missing/invalid start yields NaN,
	// which fails the check and hides the menu (fail-safe).
	const RESCHEDULE_CUTOFF_MS = 24 * 60 * 60 * 1000;
	function canManage(event) {
		return new Date(event.start).getTime() - Date.now() >= RESCHEDULE_CUTOFF_MS;
	}

	// While a menu is open, close it on any outside click. The trigger's own
	// onclick calls stopPropagation, so opening never immediately re-closes.
	$effect(() => {
		if (openMenuId === null) return;
		const onDocClick = () => closeMenu();
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});

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
		validRange,
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
		// role="button") even on the profile page, which passes no handler.
		...(onEventClick && { eventClick: (info) => onEventClick(info) }),
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
		<!-- Overflow menu: trigger + top-right-anchored popup with booking actions.
		     justify-between pushes the wrapper to the row's right padding edge,
		     aligning the ⋮ with the date shown in the day header above. Hidden once
		     the booking is within 24h — reschedule/cancel are no longer allowed. -->
		{#if canManage(info.event)}
			<div class="relative shrink-0">
				<button
					type="button"
					aria-label={m.bookingActions()}
					aria-haspopup="menu"
					aria-expanded={openMenuId === info.event.id}
					aria-controls="booking-menu-{info.event.id}"
					onclick={(e) => {
						e.stopPropagation();
						toggleMenu(info.event.id, e.currentTarget);
					}}
					onkeydown={(e) => onMenuKeydown(e, info.event.id)}
					class="px-2 py-0.5 text-lg leading-none text-gray-500 bg-transparent rounded hover:bg-gray-100"
				>
					⋮
				</button>
				{#if openMenuId === info.event.id}
					<div
						use:focusFirst
						id="booking-menu-{info.event.id}"
						role="menu"
						aria-label={m.bookingActions()}
						class="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
					>
						<button
							type="button"
							role="menuitem"
							onclick={(e) => {
								e.stopPropagation();
								onMoveEvent?.(info.event);
								closeMenu();
							}}
							onkeydown={(e) => onMenuKeydown(e, info.event.id)}
							class="block w-full px-3 py-1.5 text-left text-sm text-gray-700 bg-transparent hover:bg-gray-100"
						>
							{m.rescheduleBooking()}
						</button>
						<button
							type="button"
							role="menuitem"
							onclick={(e) => {
								e.stopPropagation();
								onCancelEvent?.(info.event);
								closeMenu();
							}}
							onkeydown={(e) => onMenuKeydown(e, info.event.id)}
							class="block w-full px-3 py-1.5 text-left text-sm text-red-600 bg-transparent hover:bg-red-50"
						>
							{m.cancelBooking()}
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	/* Color the "Book" custom toolbar button as the app's
	   primary call-to-action (indigo-600), matching Form/PasswordReset submit
	   buttons. Scoped to this component's calendar so the admin weekly Calendar
	   is unaffected; :global reaches the child <Calendar>'s generated markup. */
	.list-calendar :global(.ec-button.ec-bookNew) {
		background-color: #4f46e5; /* indigo-600 */
		border-color: #4f46e5;
		color: #fff;
		margin-left: 0.5rem;
	}
	.list-calendar :global(.ec-button.ec-bookNew:hover) {
		background-color: #4338ca; /* indigo-700 */
		border-color: #4338ca;
	}

	/* Hide prev/next entirely at the year-paging boundaries rather than showing
	   a greyed-out control. The library toggles the `disabled` attribute (via
	   validRange), so this reacts automatically as the visible year changes. */
	.list-calendar :global(.ec-button.ec-prev:disabled),
	.list-calendar :global(.ec-button.ec-next:disabled) {
		display: none;
	}

	/* Bold the toolbar title. In the listYear view the title is just the year
	   (titleFormat: {year}), so this emphasizes the year the list covers. */
	.list-calendar :global(.ec-title) {
		font-weight: 700;
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
