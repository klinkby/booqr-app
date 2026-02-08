<script>
    import {Calendar, TimeGrid} from '@event-calendar/core';
    import '@event-calendar/core/index.css';

    let {
        events = [],
        onDatesChange = undefined
    } = $props();

    // Use $derived to reactively compute options based on props
    let options = $derived({
        view: 'timeGridWeek',
        events,
        firstDay: 1, // Start week on Monday
        allDaySlot: false, // Hide all-day slot since we're showing time-specific vacancies
        slotMinTime: '06:00:00', // Start day at 6 AM
        slotMaxTime: '22:00:00', // End day at 10 PM
        headerToolbar: {
            start: 'prev,next today',
            center: 'title',
            end: ''
        },
        buttonText: {
            today: 'Today'
        },
        // Event Calendar calls this when date range changes
        datesSet: onDatesChange
    });
</script>

<Calendar plugins={[TimeGrid]} {options} />
