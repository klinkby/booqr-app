<script>
	let { options = [], onselect, emptyMessage = 'No options available.' } = $props();
</script>

{#if options.length === 0}
	<p>{emptyMessage}</p>
{:else}
	<ul class="space-y-3 list-none p-0 m-0">
		{#each options as option (option.id)}
			<li>
				<button
					type="button"
					onclick={() => onselect(option)}
					class="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					<div class="font-medium">{option.primary}</div>
					{#if option.secondary}
						<div class="text-sm text-gray-600">{option.secondary}</div>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
{/if}
