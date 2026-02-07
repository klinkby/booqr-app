<script>
	let {
		columns,
		rows,
		hasPreviousPage = false,
		hasNextPage = false,
		onedit = undefined,
		ondelete = undefined,
		onnextpage = undefined,
		onpreviouspage = undefined
	} = $props();

	const hasActions = $derived(onedit || ondelete);
	const hasPaging = $derived(onnextpage || onpreviouspage);
</script>

<div>
	<table class="w-full text-left">
		<thead class="divide-y divide-gray-200">
			<tr>
				{#each columns as column}
					<th class="text-sm font-medium text-gray-700 px-4 py-3 bg-gray-50">{column.label}</th>
				{/each}
				{#if hasActions}
					<th class="text-sm font-medium text-gray-700 px-4 py-3 bg-gray-50">Actions</th>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200">
			{#each rows as row}
				<tr class="hover:bg-gray-50">
					{#each columns as column}
						<td class="px-4 py-3 text-sm text-gray-900">{row[column.key]}</td>
					{/each}
					{#if hasActions}
						<td class="px-4 py-3 text-sm">
							{#if onedit}
								<button
									type="button"
									class="text-indigo-600 hover:text-indigo-900"
									onclick={() => onedit(row)}
								>Edit</button>
							{/if}
							{#if ondelete}
								<button
									type="button"
									class="text-indigo-600 hover:text-indigo-900 ml-3"
									onclick={() => ondelete(row)}
								>Delete</button>
							{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if hasPaging}
		<nav aria-label="Pagination" class="flex justify-between items-center mt-4 px-4">
			<button
				type="button"
				class="bg-indigo-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!hasPreviousPage}
				onclick={onpreviouspage}
			>Previous</button>
			<button
				type="button"
				class="bg-indigo-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!hasNextPage}
				onclick={onnextpage}
			>Next</button>
		</nav>
	{/if}
</div>
