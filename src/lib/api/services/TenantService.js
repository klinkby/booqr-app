import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TenantService {
    /**
     * Resolve the current tenant's public branding
     * Tenant
     * @returns TenantResponse OK
     * @throws ApiError
     */
    static getTenant() {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my-tenant',
            errors: {
                404: `Not Found`,
            },
        });
    }
}
