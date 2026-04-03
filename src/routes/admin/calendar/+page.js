import {VacancyService} from '$lib/api';
import {invokeApi} from '$lib/invokeApi';
import {vacancyCache} from './vacancyCache.js';

export async function load({url, depends}) {
	depends('app:vacancies');

	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	if (!from || !to) return {vacancies: []};

	const cached = vacancyCache.get(from, to);
	if (cached) return {vacancies: cached};

	const vacancies = (await invokeApi(() => VacancyService.getVacancies(from, to, 0, 100))).items;
	vacancyCache.set(from, to, vacancies);
	return {vacancies};
}
