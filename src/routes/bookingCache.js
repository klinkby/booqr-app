const cache = new Map();

export const bookingCache = {
	getVacancies: (from, to) => cache.get(`v|${from}|${to}`),
	setVacancies: (from, to, items) => cache.set(`v|${from}|${to}`, items),
	purgeVacancies: (from, to) => cache.delete(`v|${from}|${to}`)
};
