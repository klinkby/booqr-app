const cache = new Map();

export const vacancyCache = {
	get: (from, to) => cache.get(`${from}|${to}`),
	set: (from, to, vacancies) => cache.set(`${from}|${to}`, vacancies),
	purge: (from, to) => cache.delete(`${from}|${to}`)
};
