/**
 * Fetches all pages from a paginated API endpoint
 * @param {Function} fetchFn - Function that takes (start, num) and returns a promise with {items: []}
 * @param {number} pageSize - Number of items per page (default: 100)
 * @returns {Promise<Array>} All items from all pages
 */
export async function fetchPaged(fetchFn, pageSize = 100) {
	const allItems = [];
	let start = 0;

	while (true) {
		const response = await fetchFn(start, pageSize);
		const items = response.items || [];
		allItems.push(...items);

		// If we got fewer than pageSize results, we've reached the end
		if (items.length < pageSize) {
			break;
		}

		// Move to next page
		start += pageSize;
	}

	return allItems;
}
