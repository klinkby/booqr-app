import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LocationService {
    /**
     * List locations
     * Location
     * @param start
     * @param num
     * @returns CollectionResponseOfLocation OK
     * @throws ApiError
     */
    static getLocations(start, num) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/locations',
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
     * Add a location
     * Location
     * @param requestBody
     * @returns CreatedResponse Created
     * @throws ApiError
     */
    static addLocation(requestBody) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/locations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get a single location
     * Location
     * @param id
     * @returns Location OK
     * @throws ApiError
     */
    static getLocationById(id) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/locations/{id}',
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
     * Update a location
     * Location
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    static updateLocation(id, requestBody) {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/locations/{id}',
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
     * Delete a location
     * Location
     * @param id
     * @returns void
     * @throws ApiError
     */
    static deleteLocation(id) {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/locations/{id}',
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
