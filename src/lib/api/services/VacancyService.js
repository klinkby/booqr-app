import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VacancyService {
    /**
     * List vacancies
     * Vacancy
     * @param fromTime
     * @param toTime
     * @param start
     * @param num
     * @returns CollectionResponseOfCalendarEvent OK
     * @throws ApiError
     */
    static getVacancies(fromTime, toTime, start, num) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/vacancies',
            query: {
                'FromTime': fromTime,
                'ToTime': toTime,
                'Start': start,
                'Num': num,
            },
        });
    }
    /**
     * Add a vacancy
     * Vacancy
     * @param requestBody
     * @returns CreatedResponse Created
     * @throws ApiError
     */
    static addVacancy(requestBody) {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/vacancies',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get a single vacancy
     * Vacancy
     * @param id
     * @returns CalendarEvent OK
     * @throws ApiError
     */
    static getVacancyById(id) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/vacancies/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Delete a vacancy
     * Vacancy
     * @param id
     * @returns void
     * @throws ApiError
     */
    static deleteVacancy(id) {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/vacancies/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                409: `Conflict`,
            },
        });
    }
}
