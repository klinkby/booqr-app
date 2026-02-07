<script>
	import { VacancyService, UserService } from '$lib/api';
	import { PaginatedTable, auth } from '$lib';

	const vacancyColumns = [
		{ key: 'startTime', label: 'Start' },
		{ key: 'endTime', label: 'End' },
		{ key: 'employeeId', label: 'Employee' },
		{ key: 'locationId', label: 'Location' }
	];
	const fetchVacancies = (start, num) => VacancyService.getVacancies(null, null, start, num);

	const bookingColumns = [
		{ key: 'startTime', label: 'Start' },
		{ key: 'endTime', label: 'End' },
		{ key: 'serviceId', label: 'Service' },
		{ key: 'locationId', label: 'Location' }
	];
	const fetchBookings = (start, num) => UserService.getMyBookings(auth.sub, null, null, start, num);
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6">Calendar</h1>

	<h2 class="text-xl font-semibold mb-4">Vacancies</h2>
	<PaginatedTable columns={vacancyColumns} fetchCommand={fetchVacancies} />

	<h2 class="text-xl font-semibold mt-8 mb-4">My Bookings</h2>
	<PaginatedTable columns={bookingColumns} fetchCommand={fetchBookings} />
</div>