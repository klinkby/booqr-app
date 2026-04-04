import { auth } from '$lib/auth.svelte.js';
import { UserService, VacancyService } from '$lib/api';
import { invokeApi } from '$lib/invokeApi';
import { bookingCache } from './bookingCache.js';

export const ssr = false;

export async function load({ url, depends }) {
	depends('app:vacancies');
	depends('app:bookings');

	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	if (!from || !to) {
		return { vacancies: [], bookings: [] };
	}

	const cached = bookingCache.getVacancies(from, to);

	const vacanciesPromise = cached
		? Promise.resolve(cached)
		: VacancyService.getVacancies(from, to, 0, 100).then((r) => {
				bookingCache.setVacancies(from, to, r.items);
				return r.items;
			});

	const bookingsPromise = auth.isLoggedIn
		? invokeApi(() => UserService.getMyBookings(auth.userId, from, to, 0, 100)).then((r) => r.items)
		: Promise.resolve([]);

	const [vacancies, bookings] = await Promise.all([vacanciesPromise, bookingsPromise]);

	return {
		vacancies,
		bookings,
	};
}
