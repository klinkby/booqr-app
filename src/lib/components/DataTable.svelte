<script>
	import { m } from '#lib/paraglide/messages.js';
	import { buttonSecondary, card, link } from '#lib/ui.js';

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
		caption = undefined,
	} = $props();

	const hasActions = $derived(onedit || ondelete);
	const hasPaging = $derived(onnextpage || onpreviouspage);
</script>

<div class={card}>
	<table class="min-w-full divide-y divide-gray-900/10">
		{#if caption}
			<caption class="sr-only">{caption}</caption>
		{/if}
		<thead class="bg-gray-50">
			<tr>
				{#each columns as column (column.key)}
					<th
						scope="col"
						class="px-4 py-4 text-left text-sm font-semibold text-gray-900 sm:px-6 {column.hideOnMobile
							? 'hidden md:table-cell'
							: ''}">{column.label}</th
					>
				{/each}
				{#if hasActions}
					<th scope="col" class="px-4 py-4 text-right text-sm font-semibold text-gray-900 sm:px-6">{m.actions()}</th>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-900/10">
			{#each rows as row, i (i)}
				<tr class="hover:bg-gray-50">
					{#each columns as column (column.key)}
						<td class="px-4 py-4 text-sm text-gray-900 sm:px-6 {column.hideOnMobile ? 'hidden md:table-cell' : ''}">
							{#if cellContent}
								{@render cellContent(column, row)}
							{:else}
								{row[column.key]}
							{/if}
						</td>
					{/each}
					{#if hasActions}
						<td class="px-4 py-4 text-right text-sm sm:px-6">
							{#if onedit}
								<button type="button" class={link} onclick={() => onedit(row)}>{m.edit()}</button>
							{/if}
							{#if ondelete}
								<button
									type="button"
									class="ml-3 font-semibold text-red-600 hover:text-red-500"
									onclick={() => ondelete(row)}>{m.delete()}</button
								>
							{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if hasPaging}
		<nav
			aria-label={m.paginationLabel()}
			class="flex items-center justify-between border-t border-gray-900/10 bg-gray-50 px-4 py-4 sm:px-6"
		>
			<button type="button" class={buttonSecondary} disabled={!hasPreviousPage} onclick={onpreviouspage}
				>{m.previous()}</button
			>
			<button type="button" class={buttonSecondary} disabled={!hasNextPage} onclick={onnextpage}>{m.next()}</button>
		</nav>
	{/if}
</div>
