import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DataTakeoutService {
    /**
     * Export the tenant workspace (admin only)
     * Takeout
     * @returns TakeoutDocument OK
     * @throws ApiError
     */
    static exportTenantTakeout() {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/takeout',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Import a tenant workspace takeout document (admin only)
     * Takeout
     * @param requestBody
     * @param dryRun
     * @returns ImportTakeoutResponse OK
     * @throws ApiError
     */
    static importTakeout(requestBody, dryRun = false) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/takeout',
            query: {
                'DryRun': dryRun,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Export my own data (GDPR portability)
     * Takeout
     * @returns TakeoutDocument OK
     * @throws ApiError
     */
    static exportMyTakeout() {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/takeout/me',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
}
