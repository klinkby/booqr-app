<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { DateUtils } from '#lib/dateUtils.js';
	import { buttonPrimary, buttonSecondary, card } from '#lib/ui.js';

	let heading = $state();

	$effect(() => {
		heading?.focus();
	});

	let employeeName = $derived(page.url.searchParams.get('employee') || m.yourProvider());
	let locationName = $derived(page.url.searchParams.get('location') || m.theLocation());

	const parseDate = (value) => {
		if (!value) return null;
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? null : d;
	};
	const startDate = $derived(parseDate(page.url.searchParams.get('start')));
	const endDate = $derived(parseDate(page.url.searchParams.get('end')));
	// Same long format as the wizard and confirm page.
	const whenLabel = $derived.by(() => {
		if (!startDate) return '';
		const day = `${startDate.getDate()}. ${startDate.toLocaleDateString(getLocale(), { month: 'long' })} ${startDate.getFullYear()} · ${DateUtils.toLocalTime(startDate)}`;
		return endDate ? `${day} – ${DateUtils.toLocalTime(endDate)}` : day;
	});

	const CONFETTI = [...Array(20).keys()];
</script>

<div class="{card} relative px-6 py-10 text-center sm:px-10">
	<div class="relative mx-auto size-16">
		<!-- Confetti burst: decorative, motion-safe only (see <style>). -->
		<div class="confetti" aria-hidden="true">
			{#each CONFETTI as i (i)}<span></span>{/each}
		</div>
		<div class="pop flex size-16 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
			<svg
				class="size-9 text-emerald-600"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				viewBox="0 0 24 24"
				aria-hidden="true"><path d="m4.5 12.75 6 6 9-13.5" /></svg
			>
		</div>
	</div>
	<h1 bind:this={heading} tabindex="-1" class="mt-6 text-2xl font-bold tracking-tight text-gray-900 outline-none">
		{m.thankYouForBooking()}
	</h1>
	{#if whenLabel}
		<p
			class="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700"
		>
			<svg
				class="size-4"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				viewBox="0 0 24 24"
				aria-hidden="true"
				><path
					d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
				/></svg
			>
			{whenLabel}
		</p>
	{/if}
	<p class="mx-auto mt-4 max-w-md text-gray-500">
		{m.appointmentConfirmed({ employee: employeeName, location: locationName })}
	</p>
	<div class="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
		<a href={resolve('/profile')} class={buttonSecondary}>{m.myBookings()}</a>
		<a href={resolve('/')} class={buttonPrimary}>{m.bookAnotherAppointment()}</a>
	</div>
</div>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.pop {
			animation: pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
		}

		@keyframes pop {
			from {
				transform: scale(0.4);
				opacity: 0;
			}
			to {
				transform: scale(1);
				opacity: 1;
			}
		}

		.confetti span {
			animation: burst 1400ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both;
		}

		@keyframes burst {
			0% {
				transform: translate(0, 0) rotate(0) scale(0.4);
				opacity: 1;
			}
			70% {
				opacity: 1;
			}
			100% {
				transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(1);
				opacity: 0;
			}
		}
	}

	.confetti {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.confetti span {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 10px;
		height: 10px;
		margin: -5px;
		border-radius: 2px;
		opacity: 0;
	}

	.confetti span:nth-child(1) {
		--x: 110px;
		--y: 24px;
		--r: 180deg;
		background: var(--color-indigo-500);
	}

	.confetti span:nth-child(2) {
		--x: 133px;
		--y: 67px;
		--r: 540deg;
		background: var(--color-emerald-500);
	}

	.confetti span:nth-child(3) {
		--x: 89px;
		--y: 89px;
		--r: 360deg;
		background: var(--color-amber-400);
		border-radius: 9999px;
	}

	.confetti span:nth-child(4) {
		--x: 82px;
		--y: 137px;
		--r: 720deg;
		background: var(--color-sky-500);
		width: 5px;
		height: 14px;
		margin: -7px -2.5px;
	}

	.confetti span:nth-child(5) {
		--x: 34px;
		--y: 129px;
		--r: 270deg;
		background: var(--color-pink-500);
	}

	.confetti span:nth-child(6) {
		--x: 0px;
		--y: 164px;
		--r: 630deg;
		background: var(--color-indigo-300);
		border-radius: 9999px;
	}

	.confetti span:nth-child(7) {
		--x: -34px;
		--y: 129px;
		--r: 450deg;
		background: var(--color-indigo-500);
	}

	.confetti span:nth-child(8) {
		--x: -82px;
		--y: 137px;
		--r: 210deg;
		background: var(--color-emerald-500);
		width: 5px;
		height: 14px;
		margin: -7px -2.5px;
	}

	.confetti span:nth-child(9) {
		--x: -89px;
		--y: 89px;
		--r: 690deg;
		background: var(--color-amber-400);
		border-radius: 9999px;
	}

	.confetti span:nth-child(10) {
		--x: -133px;
		--y: 67px;
		--r: 330deg;
		background: var(--color-sky-500);
	}

	.confetti span:nth-child(11) {
		--x: -110px;
		--y: 24px;
		--r: 600deg;
		background: var(--color-pink-500);
	}

	.confetti span:nth-child(12) {
		--x: -133px;
		--y: -19px;
		--r: 240deg;
		background: var(--color-indigo-300);
		border-radius: 9999px;
	}

	.confetti span:nth-child(13) {
		--x: -89px;
		--y: -41px;
		--r: 720deg;
		background: var(--color-indigo-500);
	}

	.confetti span:nth-child(14) {
		--x: -82px;
		--y: -89px;
		--r: 390deg;
		background: var(--color-emerald-500);
	}

	.confetti span:nth-child(15) {
		--x: -34px;
		--y: -81px;
		--r: 540deg;
		background: var(--color-amber-400);
		border-radius: 9999px;
	}

	.confetti span:nth-child(16) {
		--x: 0px;
		--y: -116px;
		--r: 300deg;
		background: var(--color-sky-500);
		width: 5px;
		height: 14px;
		margin: -7px -2.5px;
	}

	.confetti span:nth-child(17) {
		--x: 34px;
		--y: -81px;
		--r: 660deg;
		background: var(--color-pink-500);
	}

	.confetti span:nth-child(18) {
		--x: 82px;
		--y: -89px;
		--r: 420deg;
		background: var(--color-indigo-300);
		border-radius: 9999px;
	}

	.confetti span:nth-child(19) {
		--x: 89px;
		--y: -41px;
		--r: 690deg;
		background: var(--color-indigo-500);
	}

	.confetti span:nth-child(20) {
		--x: 133px;
		--y: -19px;
		--r: 480deg;
		background: var(--color-emerald-500);
		width: 5px;
		height: 14px;
		margin: -7px -2.5px;
	}
</style>
