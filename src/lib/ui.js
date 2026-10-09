// Shared Tailwind class strings from docs/design.md. Reuse these instead of copying class lists into pages.

export const label = 'mb-2 block text-sm/6 font-semibold text-gray-900';
export const input =
	'block w-full rounded-lg border-gray-300 px-3 py-1.5 text-base text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm/6';
export const groupHeading = 'text-xl font-normal tracking-tight text-gray-500';
export const radio = 'size-4 border-gray-300 text-indigo-600 focus:ring-indigo-600';
export const checkbox = `${radio} rounded`;
export const choiceLabel = 'text-sm text-gray-900';
export const link = 'font-semibold text-indigo-600 hover:text-indigo-500';
export const alert = 'rounded-lg bg-red-50 px-4 py-4 text-sm text-red-800';
export const success = 'rounded-lg bg-green-50 px-4 py-4 text-sm text-green-800';
export const sectionHeading = 'text-base font-bold text-gray-900';
export const cardActions =
	'flex items-center justify-end gap-3 border-t border-gray-900/10 bg-gray-50 px-4 py-4 sm:px-6';
// Full-width message bars inside a card (no rounding; the card clips them).
export const cardAlert = 'bg-red-50 px-4 py-4 text-sm text-red-800 sm:px-6';
export const cardSuccess = 'bg-green-50 px-4 py-4 text-sm text-green-800 sm:px-6';
export const card = 'overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5';
export const cardSection = 'px-4 py-4 sm:px-6';
// Calendar event colours (docs/design.md › Calendar).
export const eventBooked = 'bg-indigo-600 text-white';
export const eventFree = 'border-l-4 border-emerald-500 bg-emerald-50 text-emerald-800';
export const eventAppointment = 'border-l-4 border-sky-500 bg-sky-50 text-sky-800';
export const eventPending = 'border border-dashed border-gray-400 bg-gray-100 text-gray-700';

const button =
	'inline-flex justify-center rounded-lg text-sm font-bold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryColours =
	'bg-white text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-indigo-600';
export const buttonPrimary = `${button} px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600`;
export const buttonSecondary = `${button} px-3.5 py-2 ${secondaryColours}`;
export const buttonDanger = `${button} px-3.5 py-2 bg-white text-red-700 ring-1 ring-gray-300 ring-inset hover:bg-red-50 focus-visible:outline-red-600`;
export const iconButtonSecondary = `${button} p-2 ${secondaryColours}`;

// `theme` option for @event-calendar/core: adds tokens to the library's own classes.
export const calendarTheme = (theme) => ({
	...theme,
	button: `${theme.button} ${buttonSecondary}`,
	buttonGroup: `${theme.buttonGroup} gap-2`,
	title: `${theme.title} ${sectionHeading}`,
	main: `${theme.main} ${card}`,
});
