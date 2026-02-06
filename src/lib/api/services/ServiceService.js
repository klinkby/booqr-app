import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ServiceService {
    /**
     * List services
     * Service
     * @param start
     * @param num
     * @returns Service OK
     * @throws ApiError
     */
    static getServices(start, num) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services',
            query: {
                'Start': start,
                'Num': num,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Add a service
     * Service
     * @param requestBody
     * @returns CreatedResponse Created
     * @throws ApiError
     */
    static addService(requestBody) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get a single service
     * Service
     * @param id
     * @returns Service OK
     * @throws ApiError
     */
    static getServiceById(id) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Update a service
     * Service
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    static updateService(id, requestBody) {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/services/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Delete a service
     * Service
     * @param id
     * @returns void
     * @throws ApiError
     */
    static deleteService(id) {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/services/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                409: `Conflict`,
            },
        });
    }
}
