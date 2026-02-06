import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BookingService {
    /**
     * Get a single booking
     * Booking
     * @param id
     * @returns any OK
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
                401: `Unauthorized`,
            },
        });
    }Array
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
                409: `Conflict`,
            },
        });
    }
    /**
     * Add a booking
     * Booking
     * @param requestBody
     * @returns CreatedResponse Created
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
            },
        });
    }
}
