<script>
	import { m } from '$lib/paraglide/messages.js';

	let { days = [], onSelectDay } = $props();

	// Chunk days into weeks of 7
	let weeks = $derived.by(() => {
		const result = [];
		for (let i = 0; i < days.length; i += 7) {
			result.push(days.slice(i, i + 7));
		}
		return result;
	});
</script>

<table class="w-full border-collapse text-center">
	<caption class="sr-only">{m.dayPickerCaption()}</caption>
	<thead>
		<tr>
			<th scope="col" class="text-xs font-medium text-gray-500 pb-2">{m.dayMon()}</th>
			<th scope="col" class="text-xs font-medium text-gray-500 pb-2">{m.dayTue()}</th>
			<th scope="col" class="text-xs font-medium text-gray-500 pb-2">{m.dayWed()}</th>
			<th scope="col" class="text-xs font-medium text-gray-500 pb-2">{m.dayThu()}</th>
			<th scope="col" class="text-xs font-medium text-gray-500 pb-2">{m.dayFri()}</th>
			<th scope="col" class="text-xs font-medium text-gray-500 pb-2">{m.daySat()}</th>
			<th scope="col" class="text-xs font-medium text-gray-500 pb-2">{m.daySun()}</th>
		</tr>
	</thead>
	<tbody>
		{#each weeks as week (week[0].date)}
			<tr>
				{#each week as day (day.date)}
					{#if !day.inMonth}
						<td class="p-1"></td>
					{:else if day.available && !day.isPast}
						<td class="p-1">
							<button
								type="button"
								class="w-10 h-10 rounded-md border border-gray-200 hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
								onclick={() => onSelectDay(day.date)}
							>
								{day.dayOfMonth}
							</button>
						</td>
					{:else}
						<td class="p-1">
							<button
								type="button"
								disabled
								class="w-10 h-10 rounded-md border border-transparent text-gray-300 disabled:cursor-not-allowed"
							>
								{day.dayOfMonth}
							</button>
						</td>
					{/if}
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
