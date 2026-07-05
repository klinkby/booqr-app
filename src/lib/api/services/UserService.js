import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserService {
    /**
     * Reset password
     * User
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    static resetPassword(requestBody) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/reset-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Change password
     * User
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    static changePassword(requestBody) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/change-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                412: `Precondition Failed`,
            },
        });
    }
    /**
     * List my bookings
     * User
     * @param id
     * @param fromTime
     * @param toTime
     * @param start
     * @param num
     * @returns MyBooking OK
     * @throws ApiError
     */
    static getMyBookings(id, fromTime, toTime, start, num) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/my-bookings',
            path: {
                'id': id,
            },
            query: {
                'FromTime': fromTime,
                'ToTime': toTime,
                'Start': start,
                'Num': num,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get a single my booking item
     * User
     * @param id
     * @param bookingId
     * @returns MyBooking OK
     * @throws ApiError
     */
    static getMyBookingById(id, bookingId) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/my-bookings/{bookingId}',
            path: {
                'id': id,
                'bookingId': bookingId,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * List users
     * User
     * @param k
     * @param role
     * @param start
     * @param num
     * @returns CollectionResponseOfUser OK
     * @throws ApiError
     */
    static getUsers(k, role, start, num) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users',
            query: {
                'K': k,
                'Role': role,
                'Start': start,
                'Num': num,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Sign up for a user account
     * User
     * @param requestBody
     * @returns CreatedResponse Created
     * @throws ApiError
     */
    static addUser(requestBody) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get a single user
     * User
     * @param id
     * @returns User OK
     * @throws ApiError
     */
    static getUserById(id) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Update a user
     * User
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    static updateUser(id, requestBody) {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{id}',
            path: {
                'id': id,
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
     * Delete a user
     * User
     * @param id
     * @returns void
     * @throws ApiError
     */
    static deleteUser(id) {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
}
