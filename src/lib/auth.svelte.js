import { getAccessToken, isValidToken } from './axiosConfig.js';
import { browser } from '$app/environment';

class AuthState {
	isLoggedIn = $state(false);

	constructor() {
		// Only refresh auth state in browser environment to avoid SSR issues
		// with sessionStorage and atob() access
		if (browser) {
			this.refresh();
		}
	}

	refresh() {
		this.isLoggedIn = isValidToken(getAccessToken());
	}
}

export const authState = new AuthState();
