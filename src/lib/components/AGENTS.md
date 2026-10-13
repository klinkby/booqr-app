# Reusable Components (`src/lib/components/`)

Import all from `'#lib'`. To add: create `.svelte` in `src/lib/components/` and add
`export { default as Name } from './components/Name.svelte';` to `src/lib/index.js`.

**Exception — `Calendar` and `ListCalendar`** are NOT exported from the `#lib` barrel.
They pull the heavy `@event-calendar/core` dependency (whose CSS side-effect import
defeats tree-shaking across the barrel), so they're lazy-loaded by direct path to keep
them out of the shared bundle:

```js
let Calendar = $state(null);
onMount(async () => {
	Calendar = (await import('#lib/components/Calendar.svelte')).default;
});
```

Render behind `{#if Calendar}` with a `role="status"` fallback. See `/admin/plan` and
`/profile` pages.

### DataTable (`src/lib/components/DataTable.svelte`)

Generic accessible table with optional edit/delete row actions and pagination. Renders inside a `card` token; header
`bg-gray-50`, divided rows, actions right-aligned (Edit uses `link`, Delete is red); the paging bar is a `bg-gray-50`
footer inside the card with `buttonSecondary` buttons.

| Prop                              | Type                                   | Default     | Description                                                            |
| --------------------------------- | -------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `columns`                         | `Array<{ key, label, hideOnMobile? }>` | required    | `key` maps to row property; `hideOnMobile` hides below `md` breakpoint |
| `rows`                            | `Array<object>`                        | required    | Data rows                                                              |
| `hasPreviousPage` / `hasNextPage` | `boolean`                              | `false`     | Enable paging buttons                                                  |
| `onedit` / `ondelete`             | `(row) => void`                        | `undefined` | Row callbacks; Actions column hidden if both omitted                   |
| `onnextpage` / `onpreviouspage`   | `() => void`                           | `undefined` | Paging callbacks; nav hidden if both omitted                           |
| `cellContent`                     | `snippet(column, row)`                 | `undefined` | Custom cell renderer; falls back to `row[column.key]` when omitted     |
| `caption`                         | `string`                               | `undefined` | sr-only `<caption>`; pass the page title                               |

### PaginatedTable (`src/lib/components/PaginatedTable.svelte`)

Wraps `DataTable` with loading, error, and empty states. Loading and empty messages sit in a `card` + `cardSection`
block (`text-sm text-gray-500`); the error uses the `alert` token — render it (not `DataTable` directly) for query-backed
lists. Forwards `columns`, `rows`, `cellContent`, `caption`, the paging props, and `onedit`/`ondelete` straight through to
`DataTable`; adds the two state props below. Pairs with `usePagedResourceQuery` (see the root `AGENTS.md`
data-loading section).

| Prop                              | Type                   | Default     | Description                                                    |
| --------------------------------- | ---------------------- | ----------- | -------------------------------------------------------------- |
| `columns` / `rows`                | —                      | `rows=[]`   | Forwarded to `DataTable`                                       |
| `isLoading`                       | `boolean`              | `false`     | Shows a `role="status"` "Loading" message instead of the table |
| `error`                           | `string \| null`       | `null`      | Shows a `role="alert"` error message instead of the table      |
| `hasPreviousPage` / `hasNextPage` | `boolean`              | `false`     | Forwarded to `DataTable`                                       |
| `onnextpage` / `onpreviouspage`   | `() => void`           | `undefined` | Forwarded to `DataTable`                                       |
| `onedit` / `ondelete`             | `(row) => void`        | `undefined` | Forwarded to `DataTable`                                       |
| `cellContent`                     | `snippet(column, row)` | `undefined` | Forwarded to `DataTable`                                       |
| `caption`                         | `string`               | `undefined` | sr-only `<caption>`; pass the page title                       |

When not loading and not errored, an empty `rows` renders a "No items found" message; otherwise it renders `DataTable`.

### Form (`src/lib/components/Form.svelte`)

Accessible form wrapper handling submission, errors, and loading state. Children are injected as the fieldset body.

| Prop                    | Type               | Default     | Description                                                                      |
| ----------------------- | ------------------ | ----------- | -------------------------------------------------------------------------------- |
| `legend`                | `string`           | required    | Fieldset label (`sr-only`)                                                       |
| `error`                 | `string \| object` | `null`      | Message or `apiError()` result, via `ErrorMessage` (kept in DOM for `aria-live`) |
| `loading`               | `boolean`          | `false`     | Disables fieldset; shows "Please wait…" on submit button                         |
| `card`                  | `boolean`          | `false`     | Design-manual card: children are `cardSection` divs, `Form` divides them         |
| `submitLabel`           | `string \| null`   | `'Submit'`  | Submit button label; `null` hides it (view-only forms)                           |
| `deleteLabel`           | `string`           | `undefined` | Delete button label; hidden if omitted                                           |
| `onsubmit`              | `(event) => void`  | required    | `preventDefault` called automatically                                            |
| `oncancel` / `ondelete` | `() => void`       | `undefined` | Buttons hidden if omitted; order Cancel, Delete, submit                          |
| `children`              | snippet            | required    | Form fields                                                                      |

### ErrorMessage (`src/lib/components/ErrorMessage.svelte`)

Inline error text for alerts. `error` is a plain string or `apiError(err)`'s `{ message, helpUrl }`; a `helpUrl` (the
ProblemDetails `type`) adds an info-circle icon link after the message that opens the problem page in a new tab. The
icon inherits the alert's red text colour; the link's sr-only name is "Error details (opens in a new tab)". Wrap it in
the alert element yourself — `Form`, `PasswordReset` and `PaginatedTable` already do.

### ConfirmDialog (`src/lib/components/ConfirmDialog.svelte`)

Native `<dialog>` confirmation, opened with `showModal()` while `open` is true. Presentational: the parent owns
`open` and runs the action. Escape and Cancel call `oncancel`; Escape is swallowed so `Form`'s document-level Escape
(navigate away) does not fire. Renders a `card` with a `cardSection` heading and message, then a `cardActions` bar.

| Prop           | Type         | Default  | Description                                          |
| -------------- | ------------ | -------- | ---------------------------------------------------- |
| `open`         | `boolean`    | required | Shows (`showModal`) or closes the dialog             |
| `title`        | `string`     | required | Heading; names the dialog (`aria-labelledby`)        |
| `message`      | `string`     | required | Body text; describes the dialog (`aria-describedby`) |
| `confirmLabel` | `string`     | required | Confirm button label                                 |
| `loading`      | `boolean`    | `false`  | Disables both buttons; confirm shows "Please wait…"  |
| `onconfirm`    | `() => void` | required | Confirm button click                                 |
| `oncancel`     | `() => void` | required | Cancel button, or Escape (ignored while `loading`)   |

### RequiredInput (`src/lib/components/RequiredInput.svelte`)

Required text input with the design-manual asterisk. Spreads all props onto the `<input>` (`id`, `name`, `type`,
`autocomplete`…), always sets `required`, and supports `bind:value`. Pair it with a `<label for>`.

### RequiredMark (`src/lib/components/RequiredMark.svelte`)

The `aria-hidden` asterisk span (`text-indigo-400`, absolute right edge). Place it inside a `relative` wrapper beside
an input; `RequiredInput` and `PhoneInput` render it.

### Calendar (`src/lib/components/Calendar.svelte`)

Presentational weekly time grid powered by `@event-calendar/core`. Data in via props, interactions out via callbacks.

| Prop                  | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| `events`              | Array of event objects (see format below)                      |
| `onDatesChange(info)` | Week navigation; `{start, end, startStr, endStr, view}`        |
| `onDateClick(info)`   | Slot click; `{date, dateStr, allDay, resource, jsEvent, view}` |
| `onEventClick(info)`  | Event click; `{event, jsEvent, view}`                          |
| `onEventResize(info)` | Resize (event needs `durationEditable: true`)                  |
| `onEventDrop(info)`   | Drag (event needs `startEditable: true`)                       |

Event shape: `{ id, start, end, title, startEditable?, durationEditable?, backgroundColor?, textColor?, extendedProps? }`.
`start`/`end` accept ISO8601 strings or Date objects.

**Timezone handling**: `@event-calendar/core` ignores `Z`/offsets and treats times as-is. Always convert UTC API
strings to local timezone-free ISO strings before passing to the calendar:

```js
import { DateUtils } from './dateUtils.js';
DateUtils.utcToLocalIso('2026-02-09T08:00:00Z'); // → "2026-02-09T10:00" (local, CET+2)
DateUtils.toLocalDate(new Date()); // → "2026-02-09"
DateUtils.toLocalTime(new Date()); // → "10:00"
```

- **API → Calendar**: `DateUtils.utcToLocalIso()`
- **Calendar → API**: `new Date(localString).toISOString()`
- **Never** `.toISOString().slice()` for form date/time extraction — gives UTC, not local

Config: 6 AM–6 PM default (expandable to midnight), Monday week start, no all-day slot, `p`/`n`/`t` keyboard
shortcuts. Event colours come from the `ui.js` event tokens passed as `classNames` (docs/design.md › Calendar).

### VacancyForm (`src/lib/components/VacancyForm.svelte`)

Side-panel form for creating and viewing vacancies. Uses `$bindable` props (Svelte 5 two-way binding).
Renders a section heading above a `<Form card>`; the parent sets the panel width.

| Prop                        | Type                       | Default        | Description                                             |
| --------------------------- | -------------------------- | -------------- | ------------------------------------------------------- |
| `mode`                      | `string`                   | `'create'`     | `'create'` or `'view'` (read-only, all fields disabled) |
| `date`                      | `string`                   | `''`           | `YYYY-MM-DD`; displayed as formatted read-only text     |
| `startTime` / `endTime`     | `string` (bindable)        | `''`           | `HH:mm`, 5-minute step                                  |
| `locationId` / `employeeId` | `string` (bindable)        | `''`           | Selected IDs                                            |
| `locations`                 | `Array<{id, name}>`        | `[]`           | —                                                       |
| `employees`                 | `Array<{id, name, email}>` | `[]`           | —                                                       |
| `error` / `loading`         | —                          | `null`/`false` | Error message; loading state                            |
| `onsubmit` / `oncancel`     | callbacks                  | required       | Submit (not called in view mode) / cancel               |
| `ondelete`                  | `() => void`               | `undefined`    | Shown only in view mode                                 |

In view mode the action bar is Cancel, then Delete; there is no submit button. Validates end > start. Panel: `sticky top-20` (clears the sticky header).

### Customer booking wizard components

Presentational, no API imports; route pages own each step's `<h1>` and focus management. Selection buttons use
`onclick`/callback props, not `<a href>` — the app is SPA-only (`ssr = false`), so progressive enhancement doesn't
apply.

| Component        | Props                                                                    | Notes                                                                           |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `ServiceList`    | `services: Array<{id,name,duration,description}>`, `onselect`            | Duration via `DateUtils.formatDuration()` — never raw seconds                   |
| `ChoiceList`     | `options: Array<{id,primary,secondary?}>`, `onselect`, `emptyMessage?`   | Shared by "Where?" and "With whom?" steps                                       |
| `MonthPicker`    | `days: Array<{date,dayOfMonth,inMonth,available,isPast}>`, `onSelectDay` | `<table>` grid; unavailable/past days are real `<button disabled>`              |
| `TimeSlotList`   | `slots: Array<{vacancyId,startTime,endTime,...}>`, `onSelectSlot`        | `startTime`/`endTime` are local `Date` objects; "No available times" when empty |
| `BookingSummary` | `items: string[]`                                                        | Breadcrumb, pre-formatted segments joined with " · "                            |

`ServiceList` and `ChoiceList` render one `card` holding a `divide-y` list of `choiceRow` buttons.

### NavBar (`src/lib/components/NavBar.svelte`)

Responsive sticky header with brand, nav links, hamburger on mobile, and optional Sign out button. The brand link shows the app icon (`#lib/assets/favicon.svg`, decorative `alt=""`) before the tenant name. The page title is
rendered by the root layout (`<h1>` in `<main>`), not by the header.

| Prop        | Type                           | Default     |
| ----------- | ------------------------------ | ----------- |
| `links`     | `Array<{ name, href, icon? }>` | `[]`        |
| `brandName` | `string`                       | `'App'`     |
| `onlogout`  | `() => void`                   | `undefined` |

A link may set an optional `icon` key (currently `'signIn'`); NavBar draws it before the label from its `ICONS` map of
Heroicons outline paths. Sign out uses the `signOut` entry from the same map.

Active link: exact match for `/`, `startsWith` for all other routes. Typical usage:

```svelte
let links = $derived([
  { name: 'Home', href: '/' },
  ...(auth.isEmployee ? [{ name: 'Calendar', href: '/admin/calendar' }] : []),
  ...(auth.isLoggedIn ? [{ name: 'My Profile', href: '/profile' }] : [{ name: 'Login', href: '/login' }]),
]);
<NavBar brandName="Booqr" {links} onlogout={auth.isLoggedIn ? handleLogout : undefined} />
```

### PasswordReset (`src/lib/components/PasswordReset.svelte`)

Presentational password reset email request form, rendered as a `card`. Parent owns all state and API logic.

| Prop                | Type             | Default  |
| ------------------- | ---------------- | -------- |
| `email` (bindable)  | `string`         | `''`     |
| `error` / `message` | `string \| null` | `null`   |
| `loading`           | `boolean`        | `false`  |
| `onsubmit`          | `() => void`     | required |

Error/success kept in DOM with `class:hidden` for reliable `aria-live` announcements.

### PhoneInput (`src/lib/components/PhoneInput.svelte`)

Presentational phone-number field: a calling-code `<select>` (Nordics, Benelux, Germany, Poland, Baltics; flag + code options; country
name on hover via `Intl.DisplayNames`) plus a digits-only `type="tel"` input. The API stores one numeric string, so the
component decodes `value` into code + number and encodes it back (`src/lib/phone.js`, unit-tested). A value with an
unrecognised prefix is shown under the default code (+45) and left untouched until the user edits it. Used by `ContactFields`.
The field is always required: the number input carries `required` and the `RequiredMark` asterisk, so `value` is never
blank on submit and callers send it to the API as-is.

| Prop               | Type     | Default | Description                                               |
| ------------------ | -------- | ------- | --------------------------------------------------------- |
| `value` (bindable) | `string` | `''`    | Calling code + number, e.g. `4512345678`; `''` when blank |

Renders `id="phone"`/`name="phone"` (number) and `id="phoneCountry"` — render at most one per page.

### ContactFields (`src/lib/components/ContactFields.svelte`)

Presentational pair of required contact fields: name (`RequiredInput`, `id="name"`) followed by `PhoneInput`. No
wrapper styling — place it inside the form's `space-y-4` section. No API calls; parents own loading and saving. Used by
the profile form, the admin contact form (create and edit) and the booking confirm step 7 form. Render at most one per
page (fixed `id`s).

| Prop               | Type     | Default | Description                       |
| ------------------ | -------- | ------- | --------------------------------- |
| `name` (bindable)  | `string` | `''`    | Contact name                      |
| `phone` (bindable) | `string` | `''`    | Calling code + number (see above) |

### SignUpForm (`src/lib/components/SignUpForm.svelte`)

Presentational sign-up card (email + accept-terms checkbox). Props: `email` (bindable), `error`, `loading`, `onsubmit`.
Shared by `/login` and the booking confirm auth gate; parents own the API call.

### Password Validation

```js
/^(?=(.*[0-9]))(?=.*[!@#$%^&*()\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z])).{8,}$/;
```

Min 8 chars, one uppercase, one lowercase, one digit, one special character.
