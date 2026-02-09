import {OpenAPI} from '../core/OpenAPI';
import {request as __request} from '../core/request';

export class AuthenticationService {
	/**
	 * Sign in
	 * Authentication
	 * @param requestBody
	 * @returns OAuthTokenResponse OK
	 * @throws ApiError
	 */
	static login(requestBody) {
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/auth/login',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				400: `Bad Request`,
			},
		});
	}

	/**
	 * Refresh auth token
	 * Authentication
	 * @returns OAuthTokenResponse OK
	 * @throws ApiError
	 */
	static refresh() {
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/auth/refresh',
			errors: {
				400: `Bad Request`,
			},
		});
	}

	/**
	 * Log out
	 * Authentication
	 * @returns void
	 * @throws ApiError
	 */
	static logout() {
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/auth/logout',
			errors: {
				400: `Bad Request`,
			},
		});
	}
}
