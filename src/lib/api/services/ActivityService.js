import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ActivityService {
    /**
     * List activities (admin only)
     * Activity
     * @param fromTime
     * @param toTime
     * @param start
     * @param num
     * @returns CollectionResponseOfActivity OK
     * @throws ApiError
     */
    static getActivities(fromTime, toTime, start, num) {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/activities',
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
}
