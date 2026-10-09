// Shared Tailwind class strings from docs/design.md. Reuse these instead of copying class lists into pages.

export const label = 'mb-2 block text-sm/6 font-semibold text-gray-900';
export const input =
	'block w-full rounded-lg border-gray-300 px-3 py-1.5 text-base text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm/6';
export const groupHeading = 'text-xl font-normal tracking-tight text-gray-500';
export const cardSection = 'px-4 py-4 sm:px-6';

const button =
	'inline-flex justify-center rounded-lg text-sm font-bold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryColours =
	'bg-white text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-indigo-600';
export const buttonPrimary = `${button} px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600`;
export const buttonSecondary = `${button} px-3.5 py-2 ${secondaryColours}`;
export const buttonDanger = `${button} px-3.5 py-2 bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600`;
export const iconButtonSecondary = `${button} p-2 ${secondaryColours}`;
