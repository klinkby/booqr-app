<script>
	import { DateUtils } from '$lib/dateUtils.js';

	let { services = [], onselect } = $props();
</script>

{#if services.length === 0}
	<p>No services available yet.</p>
{:else}
	<ul class="space-y-3 list-none p-0 m-0">
		{#each services as service (service.id)}
			<li>
				<button
					type="button"
					class="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					onclick={() => onselect(service)}
				>
					<div class="font-medium">{service.name}</div>
					<div class="text-sm text-gray-600">{DateUtils.formatDuration(service.duration)}</div>
					{#if service.description}
						<div class="text-sm text-gray-600">{service.description}</div>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
{/if}
