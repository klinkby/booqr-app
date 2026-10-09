<script>
	import { DateUtils } from '#lib/dateUtils.js';
	import { m } from '#lib/paraglide/messages.js';
	import { card, choiceRow } from '#lib/ui.js';

	let { services = [], onselect } = $props();
</script>

{#if services.length === 0}
	<p class="text-sm text-gray-500">{m.noServicesAvailable()}</p>
{:else}
	<ul class="{card} divide-y divide-gray-100">
		{#each services as service (service.id)}
			<li>
				<button type="button" class={choiceRow} onclick={() => onselect(service)}>
					<span class="min-w-0 flex-1">
						<span class="block text-sm font-semibold text-gray-900">{service.name}</span>
						{#if service.description}
							<span class="block text-sm text-gray-500">{service.description}</span>
						{/if}
					</span>
					<span class="shrink-0 text-sm text-gray-500">{DateUtils.formatDuration(service.duration)}</span>
					<svg class="size-5 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</li>
		{/each}
	</ul>
{/if}
