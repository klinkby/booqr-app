<script>
	import { DateUtils } from '$lib/dateUtils.js';
	import { m } from '$lib/paraglide/messages.js';

	let { slots = [], onSelectSlot } = $props();
</script>

{#if slots.length === 0}
	<p>{m.noAvailableTimes()}</p>
{:else}
	<ul class="mx-auto grid max-w-md grid-cols-3 gap-2 list-none p-0 sm:grid-cols-4 md:grid-cols-6">
		{#each slots as slot, i (slot.vacancyId + '-' + slot.startTime.getTime())}
			<li class:col-start-1={i > 0 && slot.startTime.getHours() !== slots[i - 1].startTime.getHours()}>
				<button
					type="button"
					onclick={() => onSelectSlot(slot)}
					aria-label={m.timeSlotLabel({
						start: DateUtils.toLocalTime(slot.startTime),
						end: DateUtils.toLocalTime(slot.endTime),
					})}
					class="w-full px-1 py-1 text-center border border-gray-200 rounded-md hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					{DateUtils.toLocalTime(slot.startTime)}
				</button>
			</li>
		{/each}
	</ul>
{/if}
