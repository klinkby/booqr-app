import { LocationService } from '$lib/api';
import { queryKeys } from '$lib/queryKeys';
import { fetchResource, useResourceMutation } from '$lib/resourceQuery.svelte.js';

/**
 * Route-local data hook for the location create/edit form.
 */
export function useLocationData() {
	const saveLocation = useResourceMutation(queryKeys.locations.all, (variables) => {
		const { id, isEdit, payload } = variables;
		return isEdit ? LocationService.updateLocation(id, payload) : LocationService.addLocation(payload);
	});

	return {
		// Always-fresh detail fetch for edit mode.
		getLocation: (id) => fetchResource(() => LocationService.getLocationById(id)),
		saveLocation: (variables) => saveLocation(variables),
	};
}
