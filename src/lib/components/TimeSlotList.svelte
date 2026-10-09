<script>
	import { DateUtils } from '#lib/dateUtils.js';
	import { m } from '#lib/paraglide/messages.js';
	import { buttonSecondary, card } from '#lib/ui.js';

	let { slots = [], onSelectSlot } = $props();
</script>

{#if slots.length === 0}
	<p class="text-sm text-gray-500">{m.noAvailableTimes()}</p>
{:else}
	<ul class="{card} grid list-none grid-cols-3 gap-2 p-4 sm:grid-cols-4 sm:p-6 md:grid-cols-6">
		{#each slots as slot, i (slot.vacancyId + '-' + slot.startTime.getTime())}
			<li class:col-start-1={i > 0 && slot.startTime.getHours() !== slots[i - 1].startTime.getHours()}>
				<button
					type="button"
					onclick={() => onSelectSlot(slot)}
					aria-label={m.timeSlotLabel({
						start: DateUtils.toLocalTime(slot.startTime),
						end: DateUtils.toLocalTime(slot.endTime),
					})}
					class="{buttonSecondary} w-full tabular-nums"
				>
					{DateUtils.toLocalTime(slot.startTime)}
				</button>
			</li>
		{/each}
	</ul>
{/if}
