<script>
	import { auth, ConfirmDialog, ContactFields, Form, apiError, ErrorMessage } from '#lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { useProfileData } from './profileData.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { alert, card, cardSection, fileInput, input, label, link, sectionHeading, success } from '#lib/ui.js';
	import { importSummaryRows, parseTakeoutFile, takeoutFileName } from './takeout.js';

	// Lazy-load the calendar (and its heavy `@event-calendar/core` dependency) so it
	// splits into its own chunk instead of the shared bundle. Import the component's
	// own module directly — not the `#lib` barrel — or the bundler can't split it out.
	let ListCalendar = $state(null);
	onMount(async () => {
		ListCalendar = (await import('#lib/components/ListCalendar.svelte')).default;
	});

	const profile = useProfileData();

	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let error = $state(null);
	let loading = $state(false);
	let initialized = $state(false);
	let successMessage = $state(null);
	let bookingError = $state(null);
	let bookingMessage = $state(null);
	let cancelling = $state(false);
	let exporting = $state(false);
	let exportError = $state(null);
	let backupBusy = $state(false);
	let backupError = $state(null);
	let backupMessage = $state(null);
	// Restore in progress: the parsed backup document and its dry-run result.
	let restoreDoc = $state.raw(null);
	let restorePreview = $state.raw(null);
	let restoreRows = $derived(restorePreview ? importSummaryRows(restorePreview) : []);

	// Auth guard: redirect unauthenticated users
	$effect(() => {
		if (!auth.isLoggedIn) {
			goto(resolve('login?returnUrl=/profile'));
		}
	});

	// Populate form fields once when cached (or freshly fetched) data arrives.
	// Guard prevents re-initialising if the mutation triggers a background refetch.
	$effect(() => {
		if (profile.user && !initialized) {
			name = profile.user.name || '';
			phone = profile.user.phone || '';
			email = profile.user.email;
			initialized = true;
		}
	});

	async function handleSubmit() {
		error = null;
		successMessage = null;
		loading = true;
		try {
			await profile.saveProfile({ name, phone });
			successMessage = m.profileUpdated();
		} catch (err) {
			error = apiError(err);
		} finally {
			loading = false;
		}
	}

	function handleBookNew() {
		goto(resolve('/'));
	}

	function handleMoveEvent(event) {
		const { serviceId, employeeId, locationId } = event.extendedProps;
		// Bind the rebook intent to a one-time nonce carried both in sessionStorage
		// and in the wizard URL. The old booking is deleted on completion only when
		// the two match, so an unrelated booking for the same service (started from
		// any URL without this nonce) can never consume a stale token.
		const nonce = crypto.randomUUID();
		try {
			sessionStorage.setItem('pendingRebook', JSON.stringify({ bookingId: event.id, nonce }));
		} catch {
			// sessionStorage unavailable — nothing to store
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams();
		params.set('employee', employeeId);
		params.set('location', locationId);
		params.set('rebook', nonce);

		goto(resolve(`book/${serviceId}?${params.toString()}`));
	}

	function handleDuplicateEvent(event) {
		const { serviceId, employeeId, locationId } = event.extendedProps;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral, built fresh for this one navigation call and discarded; not shared mutable state
		const params = new URLSearchParams();
		params.set('employee', employeeId);
		params.set('location', locationId);

		goto(resolve(`book/${serviceId}?${params.toString()}`));
	}

	async function handleCancelEvent(event) {
		// ListCalendar fires this without awaiting and closes its menu immediately,
		// so guard against a second cancel landing before the first settles.
		if (cancelling) return;
		cancelling = true;
		bookingError = null;
		bookingMessage = null;
		try {
			await profile.cancelBooking(event.id);
			bookingMessage = m.bookingCancelled();
		} catch (err) {
			bookingError = apiError(err);
		} finally {
			cancelling = false;
		}
	}

	// Hand a takeout document to the browser as a JSON file download. The object
	// URL is revoked right after the click so the PII doesn't linger in memory.
	function downloadJson(doc) {
		const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = takeoutFileName(doc);
		a.click();
		URL.revokeObjectURL(url);
	}

	// GDPR takeout: the user's own data document.
	async function handleExport() {
		if (exporting) return;
		exporting = true;
		exportError = null;
		try {
			downloadJson(await profile.exportMyTakeout());
		} catch (err) {
			exportError = apiError(err);
		} finally {
			exporting = false;
		}
	}

	// Organization backup (admin only). Download and restore share one busy flag
	// and one message area so the card never shows two operations at once.
	async function handleBackupDownload() {
		if (backupBusy) return;
		backupBusy = true;
		backupError = null;
		backupMessage = null;
		try {
			downloadJson(await profile.exportTenantTakeout());
		} catch (err) {
			backupError = apiError(err);
		} finally {
			backupBusy = false;
		}
	}

	// Restore step 1: parse the chosen file and dry-run it, then open the
	// confirmation dialog with the server's preview of what would change.
	async function handleRestoreFile(event) {
		const fileInput = event.currentTarget;
		const file = fileInput.files?.[0];
		// Clear the picker so choosing the same file again fires `change` again.
		fileInput.value = '';
		if (!file || backupBusy) return;
		backupBusy = true;
		backupError = null;
		backupMessage = null;
		try {
			const doc = parseTakeoutFile(await file.text());
			if (!doc) {
				backupError = m.invalidBackupFile();
				return;
			}
			restorePreview = await profile.importTakeout(doc, true);
			restoreDoc = doc;
		} catch (err) {
			backupError = apiError(err);
		} finally {
			backupBusy = false;
		}
	}

	// Restore step 2: the admin confirmed — run the real import.
	async function handleRestoreConfirm() {
		if (!restoreDoc || backupBusy) return;
		backupBusy = true;
		try {
			await profile.importTakeout(restoreDoc, false);
			backupMessage = m.backupRestored();
			closeRestore();
		} catch (err) {
			backupError = apiError(err);
			closeRestore();
		} finally {
			backupBusy = false;
		}
	}

	// Drop the parsed document as soon as the dialog closes — it holds PII.
	function closeRestore() {
		restoreDoc = null;
		restorePreview = null;
	}

	const entityLabels = {
		users: () => m.takeoutUsers(),
		locations: () => m.navLocations(),
		services: () => m.navServices(),
		bookings: () => m.takeoutBookings(),
		calendar: () => m.takeoutCalendar(),
	};
</script>

{#snippet downloadIcon()}
	<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
		<path
			d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		></path>
	</svg>
{/snippet}

{#if auth.isLoggedIn}
	<div>
		{#if profile.isLoading}
			<div role="status" aria-live="polite">
				<p class="text-sm text-gray-500">{m.loading()}</p>
			</div>
		{:else if profile.error}
			<div role="alert" aria-live="assertive" class={alert}>
				<ErrorMessage error={apiError(profile.error)} />
			</div>
		{:else}
			<!-- Calendar takes the remaining width on the left; the profile form is a
			     fixed narrower pane on the right. Stacks (calendar first) on mobile. -->
			<div class="flex flex-col gap-6 lg:flex-row lg:gap-16">
				<!-- Section 1: Bookings List Calendar -->
				<section class="min-w-0 flex-1" aria-labelledby="bookings-heading">
					<h2 id="bookings-heading" class="{sectionHeading} mb-4">{m.myBookings()}</h2>
					{#if bookingMessage}
						<div role="status" aria-live="polite" class="{success} mb-4">{bookingMessage}</div>
					{/if}
					{#if bookingError}
						<div role="alert" aria-live="assertive" class="{alert} mb-4"><ErrorMessage error={bookingError} /></div>
					{/if}
					{#if ListCalendar}
						<ListCalendar
							events={profile.bookingEvents}
							onBookNew={handleBookNew}
							onMoveEvent={handleMoveEvent}
							onCancelEvent={handleCancelEvent}
							onDuplicateEvent={handleDuplicateEvent}
						/>
					{:else}
						<p role="status" class="p-4 text-sm text-gray-500">{m.loading()}</p>
					{/if}
				</section>

				<!-- Right pane (fixed, narrower): profile form, admin backup, GDPR export. -->
				<div class="lg:w-80 lg:shrink-0">
					<section aria-labelledby="profile-heading">
						<h2 id="profile-heading" class="{sectionHeading} mb-4">{m.legendEditProfile()}</h2>
						<div>
							<!-- Success message -->
							{#if successMessage}
								<div role="status" aria-live="polite" class="{success} mb-4">{successMessage}</div>
							{/if}

							<Form
								card
								legend={m.legendEditProfile()}
								{error}
								{loading}
								submitLabel={m.update()}
								onsubmit={handleSubmit}
							>
								<div class="{cardSection} space-y-4">
									<ContactFields bind:name bind:phone>
										<!-- Email: read-only display -->
										<div>
											<label for="email" class={label}> {m.labelEmail()} </label>
											<input
												id="email"
												name="email"
												type="email"
												disabled
												bind:value={email}
												class={input}
												title={m.emailCannotBeChanged()}
											/>
										</div>
									</ContactFields>
								</div>
							</Form>
						</div>
					</section>

					{#if auth.isAdmin}
						<!-- Organization backup (admin only): download, or restore via a
					     dry-run preview and a confirmation dialog. -->
						<section class="mt-6" aria-labelledby="backup-heading">
							<h2 id="backup-heading" class="{sectionHeading} mb-4">{m.backupHeading()}</h2>
							<div class={card}>
								<div class="{cardSection} space-y-4">
									{#if backupMessage}
										<div role="status" aria-live="polite" class={success}>{backupMessage}</div>
									{/if}
									{#if backupError}
										<div role="alert" aria-live="assertive" class={alert}><ErrorMessage error={backupError} /></div>
									{/if}
									<p class="flex items-center gap-1 text-sm text-gray-500">
										{@render downloadIcon()}
										<button
											type="button"
											class="{link} disabled:opacity-50"
											onclick={handleBackupDownload}
											disabled={backupBusy}
											aria-busy={backupBusy}
											aria-describedby="backup-download-rest"
										>
											{m.download()}
										</button>
										<span id="backup-download-rest">{m.backupDownloadRest()}</span>
									</p>
									<div>
										<label for="restore-backup" class={label}>{m.restoreBackupLabel()}</label>
										<input
											id="restore-backup"
											name="restore-backup"
											type="file"
											accept="application/json,.json"
											class={fileInput}
											disabled={backupBusy}
											onchange={handleRestoreFile}
										/>
									</div>
								</div>
							</div>
						</section>
					{/if}

					{#if exportError}
						<div role="alert" aria-live="assertive" class="{alert} mt-4"><ErrorMessage error={exportError} /></div>
					{/if}
					<!-- Inset by the card's own padding so the line aligns with the fields
				     above. It's an action, so the link-styled word is a <button>; the
				     rest of the sentence describes it for assistive tech. -->
					<p class="{cardSection} flex items-center gap-1 text-sm text-gray-500">
						{@render downloadIcon()}
						<button
							type="button"
							class="{link} disabled:opacity-50"
							onclick={handleExport}
							disabled={exporting}
							aria-busy={exporting}
							aria-describedby="export-my-data-rest"
						>
							{m.download()}
						</button>
						<span id="export-my-data-rest">{m.exportMyDataRest()}</span>
					</p>
				</div>
			</div>
		{/if}
	</div>

	{#if auth.isAdmin}
		<ConfirmDialog
			open={!!restorePreview}
			title={m.restoreBackupTitle()}
			message={m.restoreBackupMessage()}
			confirmLabel={m.restore()}
			loading={backupBusy}
			onconfirm={handleRestoreConfirm}
			oncancel={closeRestore}
		>
			<table class="w-full text-sm">
				<caption class="sr-only">{m.restoreBackupTitle()}</caption>
				<thead>
					<tr class="text-gray-500">
						<td></td>
						<th scope="col" class="py-2 text-right font-semibold">{m.importCreated()}</th>
						<th scope="col" class="py-2 text-right font-semibold">{m.importMatched()}</th>
						<th scope="col" class="py-2 text-right font-semibold">{m.importSkipped()}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-900/10 text-gray-900">
					{#each restoreRows as row (row.key)}
						<tr>
							<th scope="row" class="py-2 text-left font-semibold">{entityLabels[row.key]()}</th>
							<td class="py-2 text-right tabular-nums">{row.created}</td>
							<td class="py-2 text-right tabular-nums">{row.matched}</td>
							<td class="py-2 text-right tabular-nums">{row.skipped}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if restorePreview?.warnings?.length}
				<ul class="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
					{#each restorePreview.warnings as warning, i (i)}
						<li>{warning.message}</li>
					{/each}
				</ul>
			{/if}
		</ConfirmDialog>
	{/if}
{/if}
