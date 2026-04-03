import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmployeeService {
    /**
     * List employees
     * Employee
     * @returns CollectionResponseOfEmployee OK
     * @throws ApiError
     */
    static getEmployees() {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/employees',
        });
    }
}
