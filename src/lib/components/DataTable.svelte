<script>
	import { m } from '$lib/paraglide/messages.js';

	let {
		columns,
		rows,
		hasPreviousPage = false,
		hasNextPage = false,
		onedit = undefined,
		ondelete = undefined,
		onnextpage = undefined,
		onpreviouspage = undefined,
		cellContent = undefined,
	} = $props();

	const hasActions = $derived(onedit || ondelete);
	const hasPaging = $derived(onnextpage || onpreviouspage);
</script>

<div>
	<table class="w-full text-left border border-gray-200">
		<thead class="divide-y divide-gray-200">
			<tr>
				{#each columns as column (column.key)}
					<th
						class="text-sm font-medium text-gray-700 px-4 py-3 bg-gray-50 {column.hideOnMobile
							? 'hidden md:table-cell'
							: ''}">{column.label}</th
					>
				{/each}
				{#if hasActions}
					<th class="text-sm font-medium text-gray-700 px-4 py-3 bg-gray-50">{m.actions()}</th>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200">
			{#each rows as row, i (i)}
				<tr class="hover:bg-gray-50">
					{#each columns as column (column.key)}
						<td class="px-4 py-3 text-sm text-gray-900 {column.hideOnMobile ? 'hidden md:table-cell' : ''}">
							{#if cellContent}
								{@render cellContent(column, row)}
							{:else}
								{row[column.key]}
							{/if}
						</td>
					{/each}
					{#if hasActions}
						<td class="px-4 py-3 text-sm">
							{#if onedit}
								<button type="button" class="text-indigo-600 hover:text-indigo-900" onclick={() => onedit(row)}
									>{m.edit()}
								</button>
							{/if}
							{#if ondelete}
								<button type="button" class="text-indigo-600 hover:text-indigo-900 ml-3" onclick={() => ondelete(row)}
									>{m.delete()}
								</button>
							{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if hasPaging}
		<nav aria-label={m.paginationLabel()} class="flex justify-between items-center mt-4 px-4">
			<button
				type="button"
				class="px-4 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!hasPreviousPage}
				onclick={onpreviouspage}
				>{m.previous()}
			</button>
			<button
				type="button"
				class="px-4 py-2 text-sm font-medium bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!hasNextPage}
				onclick={onnextpage}
				>{m.next()}
			</button>
		</nav>
	{/if}
</div>
