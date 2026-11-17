<script>
	import ConfirmDialog from './ConfirmDialog.svelte';
	import ErrorMessage from './ErrorMessage.svelte';
	import { apiError } from '#lib/apiErrorMessage.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		alert as alertClass,
		buttonSecondary,
		card,
		menuItem,
		menuItemDanger,
		menuPanel,
		menuTrigger,
	} from '#lib/ui.js';

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
		rowActions = undefined,
		rowName = (row) => row.name,
		canDelete = () => true,
		caption = undefined,
	} = $props();

	const hasActions = $derived(rowActions || onedit || ondelete);
	const hasPaging = $derived(onnextpage || onpreviouspage);
	const uid = $props.id();

	// Overflow menu: id of the row whose menu is open (null = all closed), plus
	// that row's ⋮ trigger for positioning and focus return.
	let openMenuId = $state(null);
	let menuTriggerEl = null;

	function toggleMenu(id, triggerEl) {
		if (openMenuId === id) {
			openMenuId = null;
		} else {
			openMenuId = id;
			menuTriggerEl = triggerEl;
		}
	}
	function closeMenu(returnFocus = false) {
		openMenuId = null;
		if (returnFocus) menuTriggerEl?.focus();
	}

	// While a menu is open, close it on any outside click (the trigger stops
	// propagation, so opening never immediately re-closes) and on scroll/resize,
	// since the fixed-position popup would otherwise drift from its trigger.
	$effect(() => {
		if (openMenuId === null) return;
		const close = () => closeMenu();
		document.addEventListener('click', close);
		window.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);
		return () => {
			document.removeEventListener('click', close);
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
		};
	});

	// The table lives in an overflow-hidden card, which would clip an absolutely
	// positioned popup on the last rows. Position it `fixed` against the trigger
	// instead: right-aligned below it, flipped above when it would leave the
	// viewport. Then move focus to the first item (standard ARIA-menu behaviour).
	function placeMenu(node) {
		const rect = menuTriggerEl.getBoundingClientRect();
		const gap = 4;
		let top = rect.bottom + gap;
		if (top + node.offsetHeight > window.innerHeight && rect.top - gap - node.offsetHeight >= 0) {
			top = rect.top - gap - node.offsetHeight;
		}
		node.style.top = `${top}px`;
		node.style.right = `${document.documentElement.clientWidth - rect.right}px`;
		node.querySelector('[role="menuitem"]')?.focus();
	}

	// Keyboard support for an open menu: Escape closes it and returns focus to the
	// trigger; Arrow keys / Home / End move between items. Attached as an action on
	// the row's menu wrapper so it covers both the trigger and the items without
	// putting a handler on a non-interactive element.
	function menuKeys(node) {
		function onKeydown(e) {
			if (openMenuId === null) return;
			if (e.key === 'Escape') {
				e.stopPropagation();
				closeMenu(true);
				return;
			}
			const items = [...node.querySelectorAll('[role="menuitem"]')];
			if (items.length === 0) return;
			const i = items.indexOf(document.activeElement);
			let next;
			if (e.key === 'ArrowDown') next = items[(i + 1) % items.length];
			else if (e.key === 'ArrowUp') next = items[(i - 1 + items.length) % items.length];
			else if (e.key === 'Home') next = items[0];
			else if (e.key === 'End') next = items[items.length - 1];
			if (next) {
				e.preventDefault();
				next.focus();
			}
		}
		node.addEventListener('keydown', onKeydown);
		return { destroy: () => node.removeEventListener('keydown', onKeydown) };
	}

	// Delete confirmation. The parent's ondelete may return a promise; the dialog
	// stays open (with a spinner, then any error) until it settles.
	let pendingDelete = $state(null);
	let deleting = $state(false);
	let deleteError = $state(null);

	function requestDelete(row) {
		// Return focus to the trigger first so the native dialog restores focus
		// there on close (the menu item it was opened from is about to unmount).
		closeMenu(true);
		deleteError = null;
		pendingDelete = row;
	}
	function cancelDelete() {
		pendingDelete = null;
		deleteError = null;
	}
	async function confirmDelete() {
		deleting = true;
		deleteError = null;
		try {
			await ondelete(pendingDelete);
			pendingDelete = null;
		} catch (err) {
			deleteError = apiError(err);
		} finally {
			deleting = false;
		}
	}
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
					{#each columns as column, c (column.key)}
						<td
							id={c === 0 && hasActions ? `${uid}-label-${row.id}` : undefined}
							class="px-4 py-4 text-sm text-gray-900 sm:px-6 {column.hideOnMobile ? 'hidden md:table-cell' : ''}"
						>
							{#if cellContent}
								{@render cellContent(column, row)}
							{:else}
								{row[column.key]}
							{/if}
						</td>
					{/each}
					{#if hasActions}
						{@const menuId = `${uid}-menu-${row.id}`}
						<td class="px-4 py-2 text-right text-sm sm:px-6">
							<div class="inline-block" use:menuKeys>
								<button
									type="button"
									aria-label={m.actions()}
									aria-haspopup="menu"
									aria-expanded={openMenuId === row.id}
									aria-controls={menuId}
									aria-describedby="{uid}-label-{row.id}"
									class={menuTrigger}
									onclick={(e) => {
										e.stopPropagation();
										toggleMenu(row.id, e.currentTarget);
									}}
								>
									⋮
								</button>
								{#if openMenuId === row.id}
									<div use:placeMenu id={menuId} role="menu" aria-label={m.actions()} class="fixed {menuPanel}">
										{#if rowActions}
											{@render rowActions(row)}
										{/if}
										{#if onedit}
											<button
												type="button"
												role="menuitem"
												class={menuItem}
												onclick={() => {
													closeMenu();
													onedit(row);
												}}>{m.edit()}</button
											>
										{/if}
										{#if ondelete && canDelete(row)}
											<button
												type="button"
												role="menuitem"
												class={menuItemDanger}
												onclick={(e) => {
													e.stopPropagation();
													requestDelete(row);
												}}>{m.delete()}</button
											>
										{/if}
									</div>
								{/if}
							</div>
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

{#if ondelete}
	<ConfirmDialog
		open={pendingDelete !== null}
		title={m.deleteConfirmTitle({ name: pendingDelete ? rowName(pendingDelete) : '' })}
		message={m.deleteConfirmMessage()}
		confirmLabel={m.delete()}
		danger
		loading={deleting}
		onconfirm={confirmDelete}
		oncancel={cancelDelete}
		children={deleteError ? deleteErrorAlert : undefined}
	/>
{/if}

{#snippet deleteErrorAlert()}
	<div role="alert" class={alertClass}><ErrorMessage error={deleteError} /></div>
{/snippet}
