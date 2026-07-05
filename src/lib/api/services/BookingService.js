import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BookingService {
    /**
     * Get a single booking
     * Booking
     * @param id
     * @returns void
     * @throws ApiError
     */
    static getBookingById(id) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookings/{id}',
            path: {
                'id': id,
            },
            errors: {
                302: `Found`,
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Delete a booking
     * Booking
     * @param id
     * @returns void
     * @throws ApiError
     */
    static deleteBooking(id) {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bookings/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Add a booking
     * Booking
     * @param requestBody
     * @returns any Created
     * @throws ApiError
     */
    static addBooking(requestBody) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bookings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
}
