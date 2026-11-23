<script>
	import { m } from '#lib/paraglide/messages.js';
	import { menuItem, menuItemDanger, menuPanel, menuTrigger } from '#lib/ui.js';

	let {
		id, // unique per page: names the popup for aria-controls
		manageable = true, // false hides Reschedule and Cancel booking, leaving Duplicate
		placement = 'below', // 'below' or 'above' the trigger
		align = 'right', // popup edge aligned with the trigger: 'right' or 'left'
		onduplicate = undefined,
		onreschedule = undefined,
		oncancelbooking = undefined,
	} = $props();

	let open = $state(false);
	let triggerEl;
	let rootEl;

	function close(returnFocus = false) {
		open = false;
		if (returnFocus) triggerEl?.focus();
	}

	// Move focus to the first menuitem when the popup opens, so a keyboard user
	// who activated the trigger lands inside the menu (standard ARIA-menu behaviour).
	function focusFirst(node) {
		node.querySelector('[role="menuitem"]')?.focus();
	}

	// Escape closes the menu and returns focus to its trigger. Bound to the
	// interactive controls themselves (trigger + menu items) rather than the
	// role="menu" container, which would then be flagged as needing a tabindex.
	// stopPropagation keeps a surrounding panel's document-level Escape from firing.
	function onKeydown(e) {
		if (e.key === 'Escape' && open) {
			e.stopPropagation();
			close(true);
		}
	}

	// While open, close on any click outside this menu. Capture phase, so it still
	// runs when another row's trigger stops propagation: opening one menu closes
	// the rest. Clicks inside (trigger, items) are handled by their own handlers.
	$effect(() => {
		if (!open) return;
		const onDocClick = (e) => {
			if (!rootEl?.contains(e.target)) close();
		};
		document.addEventListener('click', onDocClick, true);
		return () => document.removeEventListener('click', onDocClick, true);
	});

	function select(e, action) {
		e.stopPropagation();
		close();
		action?.();
	}
</script>

<div bind:this={rootEl} class="relative shrink-0">
	<button
		bind:this={triggerEl}
		type="button"
		aria-label={m.bookingActions()}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls="booking-menu-{id}"
		onclick={(e) => {
			e.stopPropagation();
			open = !open;
		}}
		onkeydown={onKeydown}
		class={menuTrigger}
	>
		⋮
	</button>
	{#if open}
		<div
			use:focusFirst
			id="booking-menu-{id}"
			role="menu"
			aria-label={m.bookingActions()}
			class="absolute {align === 'left' ? 'left-0' : 'right-0'} {placement === 'above'
				? 'bottom-full mb-1'
				: 'top-full mt-1'} {menuPanel}"
		>
			<button
				type="button"
				role="menuitem"
				onclick={(e) => select(e, onduplicate)}
				onkeydown={onKeydown}
				class={menuItem}
			>
				{m.duplicateBooking()}
			</button>
			{#if manageable}
				<button
					type="button"
					role="menuitem"
					onclick={(e) => select(e, onreschedule)}
					onkeydown={onKeydown}
					class={menuItem}
				>
					{m.rescheduleBooking()}
				</button>
				<button
					type="button"
					role="menuitem"
					onclick={(e) => select(e, oncancelbooking)}
					onkeydown={onKeydown}
					class={menuItemDanger}
				>
					{m.cancelBooking()}
				</button>
			{/if}
		</div>
	{/if}
</div>
