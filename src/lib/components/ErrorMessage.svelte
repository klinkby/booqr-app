<script>
	import { m } from '#lib/paraglide/messages.js';

	// `error` is a plain string or `apiError()`'s `{ message, helpUrl }`; a helpUrl adds an info link to the problem type.
	let { error = null } = $props();

	let message = $derived(typeof error === 'string' ? error : error?.message);
	let helpUrl = $derived(typeof error === 'string' ? null : error?.helpUrl);
</script>

{message}
{#if helpUrl}
	<a
		href={helpUrl}
		target="_blank"
		rel="external noopener noreferrer"
		title={m.errorDetails()}
		class="ml-1 inline-flex rounded-full align-text-bottom hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
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
				d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
			/></svg
		>
		<span class="sr-only">{m.errorDetails()} {m.opensInNewTab()}</span>
	</a>
{/if}
