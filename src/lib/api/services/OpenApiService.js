import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OpenApiService {
    /**
     * OpenAPI specification version 1
     * @returns any OK
     * @throws ApiError
     */
    static openapiV1() {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1.json',
        });
    }
}
