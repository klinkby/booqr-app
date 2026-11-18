<script>
	import { apiError, PaginatedTable } from '#lib';
	import { DateUtils } from '#lib/dateUtils.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { useLogData } from './logData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { input, label, link } from '#lib/ui.js';

	const columns = [
		{ key: 'timestamp', label: m.labelTime() },
		{ key: 'userId', label: m.labelUser() },
		{ key: 'entity', label: m.labelEntity() },
		{ key: 'entityId', label: m.labelEntityId(), hideOnMobile: true },
		{ key: 'action', label: m.labelAction() },
	];

	// `?from=YYYY-MM-DD` (local date) drives the query; a missing or
	// impossible date (e.g. 2026-02-31) falls back to today.
	let fromMidnight = $derived(
		DateUtils.parseLocalDate(page.url.searchParams.get('from')) ??
			DateUtils.parseLocalDate(DateUtils.toLocalDate(new Date())),
	);
	let fromDate = $derived(DateUtils.toLocalDate(fromMidnight));

	// Local midnight of the picked date, sent to the API as UTC.
	const log = useLogData(() => fromMidnight.toISOString());

	let error = $derived(log.error ? apiError(log.error) : null);

	function handleDateChange(event) {
		const value = event.currentTarget.value;
		if (!DateUtils.parseLocalDate(value)) return;
		goto(resolve(`admin/log?from=${value}`), { replace: true, keepFocus: true, noScroll: true });
	}

	function formatTimestamp(iso) {
		return new Date(iso).toLocaleString(getLocale(), { dateStyle: 'short', timeStyle: 'medium' });
	}
</script>

<div>
	{#snippet cellContent(column, row)}
		{#if column.key === 'timestamp'}
			<time datetime={row.timestamp}>{formatTimestamp(row.timestamp)}</time>
		{:else if column.key === 'userId'}
			<a href={resolve(`admin/contacts/${row.userId}`)} class={link}>{row.userId}</a>
		{:else}
			{row[column.key]}
		{/if}
	{/snippet}
	<div class="mb-4 flex justify-end">
		<div>
			<label class={label} for="log-from">{m.labelFrom()}</label>
			<input class={input} id="log-from" name="from" type="date" value={fromDate} onchange={handleDateChange} />
		</div>
	</div>
	<PaginatedTable
		{columns}
		rows={log.items}
		isLoading={log.isLoading}
		{error}
		hasPreviousPage={log.hasPreviousPage}
		hasNextPage={log.hasNextPage}
		onnextpage={log.nextPage}
		onpreviouspage={log.previousPage}
		{cellContent}
		caption={m.titleLog()}
	/>
</div>
