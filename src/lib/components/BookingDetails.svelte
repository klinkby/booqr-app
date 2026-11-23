<script>
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { DateUtils } from '#lib/dateUtils.js';
	import { formatPhone } from '#lib/phone.js';
	import { buttonSecondary, card, cardActions, cardAlert, cardSection, input, label, sectionHeading } from '#lib/ui.js';
	import BookingMenu from './BookingMenu.svelte';
	import ErrorMessage from './ErrorMessage.svelte';

	let {
		id, // booking id, names the actions menu
		date = '', // YYYY-MM-DD
		startTime = '', // HH:mm
		endTime = '',
		locationId = '',
		employeeId = '',
		serviceName = '',
		customerName = '',
		customerEmail = '',
		customerPhone = '',
		notes = '',
		locations = [],
		employees = [],
		error = null,
		loading = false,
		onclose,
		onduplicate = undefined,
		onreschedule = undefined,
		oncancelbooking = undefined,
	} = $props();

	const formattedDate = $derived(DateUtils.formatLongDate(date, getLocale()));

	// Escape closes the panel, like the Close button. The actions menu swallows its
	// own Escape (closing just the menu) before it reaches the document.
	$effect(() => {
		function handleEscape(e) {
			if (e.key === 'Escape' && !loading) {
				e.preventDefault();
				onclose();
			}
		}
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	});
</script>

<div class="sticky top-20">
	<h2 class="{sectionHeading} mb-4">{m.appointmentDetails()}</h2>

	<div class={card}>
		<div aria-live="polite" class={cardAlert} class:hidden={!error} role="alert">
			<p><ErrorMessage {error} /></p>
		</div>

		<fieldset class="min-w-0 divide-y divide-gray-900/10" disabled aria-busy={loading}>
			<legend class="sr-only">{m.legendViewAppointment()}</legend>

			<div class="{cardSection} space-y-4">
				{#if formattedDate}
					<p class="text-sm text-gray-500">{formattedDate}</p>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class={label} for="appointment-startTime">{m.labelStart()}</label>
						<input value={startTime} class={input} id="appointment-startTime" type="time" />
					</div>
					<div>
						<label class={label} for="appointment-endTime">{m.labelEnd()}</label>
						<input value={endTime} class={input} id="appointment-endTime" type="time" />
					</div>
				</div>

				<div>
					<label class={label} for="appointment-locationId">{m.labelLocation()}</label>
					<select value={String(locationId)} class={input} id="appointment-locationId">
						{#each locations as location (location.id)}
							<option value={String(location.id)}>{location.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class={label} for="appointment-employeeId">{m.labelEmployee()}</label>
					<select value={String(employeeId)} class={input} id="appointment-employeeId">
						{#each employees as employee (employee.id)}
							<option value={String(employee.id)}>{employee.name || employee.email}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class={label} for="appointment-service">{m.labelService()}</label>
					<input value={serviceName} class={input} id="appointment-service" type="text" />
				</div>
			</div>

			<div class="{cardSection} space-y-4">
				<div>
					<label class={label} for="appointment-customer">{m.customer()}</label>
					<input value={customerName} class={input} id="appointment-customer" type="text" />
				</div>
				<div>
					<label class={label} for="appointment-email">{m.labelEmail()}</label>
					<input value={customerEmail} class={input} id="appointment-email" type="email" />
				</div>
				<div>
					<label class={label} for="appointment-phone">{m.labelPhone()}</label>
					<input
						value={customerPhone ? formatPhone(customerPhone) : ''}
						class={input}
						id="appointment-phone"
						type="tel"
					/>
				</div>
				<div>
					<label class={label} for="appointment-notes">{m.notes()}</label>
					<textarea value={notes} class={input} id="appointment-notes" rows="4"></textarea>
				</div>
			</div>
		</fieldset>

		<div class={cardActions}>
			<!-- ⋮ floats left (mr-auto), Cancel stays right; the popup opens up and
			     left-aligned so the card's overflow-hidden can't clip it. -->
			{#if !loading}
				<div class="mr-auto">
					<BookingMenu {id} placement="above" align="left" {onduplicate} {onreschedule} {oncancelbooking} />
				</div>
			{/if}
			<button type="button" class="{buttonSecondary} flex-1 sm:flex-none" onclick={onclose}>{m.close()}</button>
		</div>
	</div>
</div>
