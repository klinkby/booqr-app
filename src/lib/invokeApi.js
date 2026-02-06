import { ApiError, AuthenticationService } from '$lib/api';
import { auth } from './auth.svelte.js';
import { goto } from '$app/navigation';

let refreshPromise = null;

/**
 * Wraps an API service call with automatic 401 refresh-and-retry.
 * Usage: await invoke(() => VacancyService.getVacancies(...))
 */
export async function invokeApi(operation) {
	try {
		return await operation();
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 401) {
			throw error;
		}
		await refreshToken();
		return await operation();
	}
}

async function refreshToken() {
	if (refreshPromise) {
		await refreshPromise;
		return;
	}
	refreshPromise = doRefresh();
	try {
		await refreshPromise;
	} finally {
		refreshPromise = null;
	}
}

async function doRefresh() {
	try {
		const response = await AuthenticationService.refresh();
		auth.accessToken = response.access_token;
	} catch (error) {
		auth.clear();
		await goto('/login');
		throw error;
	}
}
