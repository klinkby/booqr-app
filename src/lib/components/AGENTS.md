# Reusable Components (`src/lib/components/`)

Import all from `'$lib'`. To add: create `.svelte` in `src/lib/components/` and add
`export { default as Name } from './components/Name.svelte';` to `src/lib/index.js`.

### DataTable (`src/lib/components/DataTable.svelte`)

Generic accessible table with optional edit/delete row actions and pagination.

| Prop                              | Type                                   | Default     | Description                                                            |
| --------------------------------- | -------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `columns`                         | `Array<{ key, label, hideOnMobile? }>` | required    | `key` maps to row property; `hideOnMobile` hides below `md` breakpoint |
| `rows`                            | `Array<object>`                        | required    | Data rows                                                              |
| `hasPreviousPage` / `hasNextPage` | `boolean`                              | `false`     | Enable paging buttons                                                  |
| `onedit` / `ondelete`             | `(row) => void`                        | `undefined` | Row callbacks; Actions column hidden if both omitted                   |
| `onnextpage` / `onpreviouspage`   | `() => void`                           | `undefined` | Paging callbacks; nav hidden if both omitted                           |
| `cellContent`                     | `snippet(column, row)`                 | `undefined` | Custom cell renderer; falls back to `row[column.key]` when omitted     |

### PaginatedTable (`src/lib/components/PaginatedTable.svelte`)

Wraps `DataTable` with loading, error, and empty states — render it (not `DataTable` directly) for query-backed
lists. Forwards `columns`, `rows`, `cellContent`, the paging props, and `onedit`/`ondelete` straight through to
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

When not loading and not errored, an empty `rows` renders a "No items found" message; otherwise it renders `DataTable`.

### Form (`src/lib/components/Form.svelte`)

Accessible form wrapper handling submission, errors, and loading state. Children are injected as the fieldset body.

| Prop                    | Type              | Default     | Description                                              |
| ----------------------- | ----------------- | ----------- | -------------------------------------------------------- |
| `legend`                | `string`          | required    | Fieldset label (`sr-only`)                               |
| `error`                 | `string \| null`  | `null`      | Error message (kept in DOM for `aria-live`)              |
| `loading`               | `boolean`         | `false`     | Disables fieldset; shows "Please wait…" on submit button |
| `submitLabel`           | `string`          | `'Submit'`  | Submit button label                                      |
| `deleteLabel`           | `string`          | `undefined` | Delete button label; hidden if omitted                   |
| `onsubmit`              | `(event) => void` | required    | `preventDefault` called automatically                    |
| `oncancel` / `ondelete` | `() => void`      | `undefined` | Buttons hidden if omitted; delete is left-aligned in red |
| `children`              | snippet           | required    | Form fields                                              |

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
shortcuts. Event styling via `classNames: ['!bg-red-500', '!text-white']`.

### VacancyForm (`src/lib/components/VacancyForm.svelte`)

Side-panel form for creating and viewing vacancies. Uses `$bindable` props (Svelte 5 two-way binding).

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

In view mode submit becomes "Close". Validates end > start. Panel: `w-80`, `sticky top-4`.

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

### NavBar (`src/lib/components/NavBar.svelte`)

Responsive sticky header with brand, nav links, hamburger on mobile, and optional Logout button.

| Prop        | Type                    | Default     |
| ----------- | ----------------------- | ----------- |
| `links`     | `Array<{ name, href }>` | `[]`        |
| `brandName` | `string`                | `'App'`     |
| `onlogout`  | `() => void`            | `undefined` |

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

Presentational password reset email request form. Parent owns all state and API logic.

| Prop                | Type             | Default  |
| ------------------- | ---------------- | -------- |
| `email` (bindable)  | `string`         | `''`     |
| `error` / `message` | `string \| null` | `null`   |
| `loading`           | `boolean`        | `false`  |
| `onsubmit`          | `() => void`     | required |

Error/success kept in DOM with `class:hidden` for reliable `aria-live` announcements.

### Password Validation

```js
/^(?=(.*[0-9]))(?=.*[!@#$%^&*()\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z])).{8,}$/;
```

Min 8 chars, one uppercase, one lowercase, one digit, one special character.
