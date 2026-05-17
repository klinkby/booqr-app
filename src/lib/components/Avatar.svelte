<script>
	import { minidenticon } from 'minidenticons';

	let { email = '', size = '1rem' } = $props();

	let svg = $derived(minidenticon(email));
	let src = $derived(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
</script>

<img {src} alt="" style="width:{size};height:{size}" />
