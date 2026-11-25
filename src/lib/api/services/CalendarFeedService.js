import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CalendarFeedService {
    /**
     * Get a calendar feed (iCalendar) via a signed link
     * CalendarFeed
     * @returns any OK
     * @throws ApiError
     */
    static getCalendarFeed() {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/calendar-feed.ics',
            errors: {
                404: `Not Found`,
            },
        });
    }
}
