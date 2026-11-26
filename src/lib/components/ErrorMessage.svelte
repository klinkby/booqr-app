<script>
	import { m } from '#lib/paraglide/messages.js';

	// `error` is a plain string or `apiError()`'s `{ message, detail, helpUrl }`. A detail turns the message into a
	// bold heading with the detail on the line below; a helpUrl adds a help (question-mark-circle) link to the problem type.
	// Phrasing content only: callers render this inside a `<p>`.
	let { error = null } = $props();

	let message = $derived(typeof error === 'string' ? error : error?.message);
	let detail = $derived(typeof error === 'string' ? null : error?.detail);
	let helpUrl = $derived(typeof error === 'string' ? null : error?.helpUrl);
</script>

<!-- The help link floats right on the last line of text (with a detail, inside the detail's block span); it stays after
     the text in the DOM so screen readers read the message first. -->
{#if detail}
	<strong class="font-semibold">{message}</strong>
	<span class="block">{detail}{@render help()}</span>
{:else}
	{message}{@render help()}
{/if}

{#snippet help()}
	{#if helpUrl}
		<a
			href={helpUrl}
			target="_blank"
			rel="external noopener noreferrer"
			title={m.errorDetails()}
			class="float-right ml-2 inline-flex rounded-full hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
		>
			<svg
				class="size-5 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				viewBox="0 0 24 24"
				aria-hidden="true"
				><path
					d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
				/></svg
			>
			<span class="sr-only">{m.errorDetails()} {m.opensInNewTab()}</span>
		</a>
	{/if}
{/snippet}
