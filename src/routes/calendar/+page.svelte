<script>
	import { VacancyService } from '$lib/api';
	import { fetchPaged } from '$lib';
	import { onMount } from 'svelte';

	let vacancies = $state([]);
	let loading = $state(true);
	let error = $state(null);

	async function fetchAllVacancies() {
		try {
			vacancies = await fetchPaged((start, num) =>
				VacancyService.getVacancies(null, null, start, num)
			);
		} catch (err) {
			error = 'Failed to load vacancies. Please try again.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchAllVacancies();
	});
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6">Calendar</h1>

	{#if loading}
		<div role="status" aria-live="polite">
			<p>Loading vacancies...</p>
		</div>
	{:else if error}
		<div role="alert" aria-live="assertive">
			<p class="text-red-600">Error: {error}</p>
		</div>
	{:else if vacancies.length === 0}
		<p>No vacancies found.</p>
	{:else}
		<div class="space-y-4">
			<p class="text-gray-600">Found {vacancies.length} vacancies</p>
			<ul class="space-y-2">
				{#each vacancies as vacancy}
					<li class="border rounded p-4">
						<pre class="text-sm overflow-x-auto">{JSON.stringify(vacancy, null, 2)}</pre>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
