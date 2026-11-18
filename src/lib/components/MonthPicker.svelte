<script>
	import { m } from '#lib/paraglide/messages.js';
	import { card } from '#lib/ui.js';

	let { days = [], selectedDate = null, onSelectDay } = $props();

	// Traffic-light colours for bookable days by remaining capacity (see docs/design.md › Booking).
	const levelClasses = {
		low: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
		high: 'bg-green-100 text-green-800 hover:bg-green-200',
	};

	// Chunk days into weeks of 7
	let weeks = $derived.by(() => {
		const result = [];
		for (let i = 0; i < days.length; i += 7) {
			result.push(days.slice(i, i + 7));
		}
		return result;
	});
</script>

<div class="{card} p-4 sm:p-6">
	<table class="w-full border-collapse text-center">
		<caption class="sr-only">{m.dayPickerCaption()}</caption>
		<thead>
			<tr>
				<th scope="col" class="pb-2 text-xs font-semibold text-gray-500">{m.dayMon()}</th>
				<th scope="col" class="pb-2 text-xs font-semibold text-gray-500">{m.dayTue()}</th>
				<th scope="col" class="pb-2 text-xs font-semibold text-gray-500">{m.dayWed()}</th>
				<th scope="col" class="pb-2 text-xs font-semibold text-gray-500">{m.dayThu()}</th>
				<th scope="col" class="pb-2 text-xs font-semibold text-gray-500">{m.dayFri()}</th>
				<th scope="col" class="pb-2 text-xs font-semibold text-gray-500">{m.daySat()}</th>
				<th scope="col" class="pb-2 text-xs font-semibold text-gray-500">{m.daySun()}</th>
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
									class="mx-auto flex size-10 items-center justify-center rounded-full font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 {levelClasses[
										day.level
									]} {day.date === selectedDate ? 'ring-3 ring-indigo-600 ring-offset-2' : ''}"
									aria-pressed={day.date === selectedDate}
									onclick={() => onSelectDay(day.date)}
								>
									{day.dayOfMonth}
									{#if day.level === 'low'}<span class="sr-only">&nbsp;{m.fewTimesLeft()}</span>{/if}
								</button>
							</td>
						{:else}
							<td class="p-1">
								<button
									type="button"
									disabled
									class="mx-auto flex size-10 items-center justify-center text-gray-400 disabled:cursor-not-allowed"
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
</div>
