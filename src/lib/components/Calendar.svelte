<script>
	import {Calendar, Interaction, TimeGrid} from '@event-calendar/core';
	import '@event-calendar/core/index.css';

	let {
		events = [],
		slotMaxTime = '18:00:00',
		onDatesChange = undefined,
		onDateClick = undefined,
		onEventClick = undefined,
		onEventResize = undefined,
		onEventDrop = undefined
	} = $props();

	let cal;

	function handleKeydown(e) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		const key = e.key.toLowerCase();

		if (key === 'p') cal?.prev();
		if (key === 'n') cal?.next();
		if (key === 't') cal?.setOption('date', new Date());
	}

	// Use $derived to reactively compute options based on props
	let options = $derived({
		view: 'timeGridWeek',
		events,
		firstDay: 1, // Start week on Monday
		allDaySlot: false, // Hide all-day slot since we're showing time-specific vacancies
		slotMinTime: '06:00:00', // Start day at 6 AM
		slotMaxTime, // End day (reactive, can be expanded)
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: ''
		},
		buttonText: {
			today: 'Today'
		},
		// Event Calendar calls this when date range changes
		datesSet: onDatesChange,
		// Event Calendar calls this when user clicks on a date/time
		dateClick: onDateClick,
		// Event Calendar calls this when user clicks on an event
		eventClick: onEventClick,
		eventResize: onEventResize,
		eventDrop: onEventDrop
	});

	// Update calendar when slotMaxTime changes
	$effect(() => {
		if (cal && slotMaxTime) {
			cal.setOption('slotMaxTime', slotMaxTime);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown}/>
<Calendar bind:this={cal} {options} plugins={[TimeGrid, Interaction]}/>
