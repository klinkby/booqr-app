import { getAccessToken, isValidToken } from './axiosConfig.js';

class AuthState {
	isLoggedIn = $state(false);

	constructor() {
		this.refresh();
	}

	refresh() {
		this.isLoggedIn = isValidToken(getAccessToken());
	}
}

export const authState = new AuthState();
