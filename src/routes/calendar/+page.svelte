<script>
	import { VacancyService } from '$lib/api';
	import { PaginatedTable } from '$lib';

	const columns = [
		{ key: 'startTime', label: 'Start' },
		{ key: 'endTime', label: 'End' },
		{ key: 'employeeId', label: 'Employee' },
		{ key: 'locationId', label: 'Location' }
	];
	const fetchCommand = (start, num) => VacancyService.getVacancies(null, null, start, num);
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6">Calendar</h1>
	<PaginatedTable {columns} {fetchCommand} />
</div>