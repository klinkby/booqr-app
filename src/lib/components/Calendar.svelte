<script>
	import { Calendar, Interaction, TimeGrid } from '@event-calendar/core';
	import '@event-calendar/core/index.css';

	let {
		events = [],
		onDatesChange = undefined,
		onDateClick = undefined,
		onEventClick = undefined,
		onEventResize = undefined,
		onEventDrop = undefined,
	} = $props();

	let cal;
	let slotMaxTime = $state('18:00:00');

	$effect(() => {
		if (cal) cal.setOption('events', events);
	});

	$effect(() => {
		if (cal) cal.setOption('slotMaxTime', slotMaxTime);
	});

	function expandCalendar() {
		const currentHour = parseInt(slotMaxTime.split(':')[0]);
		const newHour = currentHour + 6;
		if (newHour < 24) {
			slotMaxTime = `${newHour.toString().padStart(2, '0')}:00:00`;
		} else if (currentHour < 24) {
			slotMaxTime = '24:00:00';
		}
	}

	function handleKeydown(e) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		const key = e.key.toLowerCase();
		if (key === 'p') cal?.prev();
		if (key === 'n') cal?.next();
		if (key === 't') cal?.setOption('date', new Date());
	}

	const options = {
		view: 'timeGridWeek',
		firstDay: 1,
		allDaySlot: false,
		slotMinTime: '06:00:00',
		slotMaxTime: '18:00:00',
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: '',
		},
		buttonText: { prev: 'Previous week', next: 'Next week', today: 'Today' },
		datesSet: (info) => onDatesChange?.(info),
		dateClick: (info) => onDateClick?.(info),
		eventClick: (info) => onEventClick?.(info),
		eventResize: (info) => onEventResize?.(info),
		eventDrop: (info) => onEventDrop?.(info),
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<Calendar bind:this={cal} {options} plugins={[TimeGrid, Interaction]} />

{#if slotMaxTime !== '24:00:00'}
	<div class="flex justify-end mt-4 mb-2">
		<button
			onclick={expandCalendar}
			class="px-4 py-2 text-sm text-gray-600 bg-transparent border border-gray-300 rounded-md hover:bg-gray-50"
		>
			Extend Hours (+6h)
		</button>
	</div>
{/if}
