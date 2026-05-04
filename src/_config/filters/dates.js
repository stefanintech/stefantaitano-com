import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

/** Converts the given date string to ISO8610 format. */
export const toISOString = dateString => dayjs(dateString).toISOString();

/** Formats a date using dayjs's conventions: https://day.js.org/docs/en/display/format */
export const formatDate = (date, format) => dayjs(date).format(format);

/**
 * Formats a date in UTC. Use for filename-derived calendar dates
 * (e.g. `2026-04-15.md`) so the displayed day doesn't shift with the build
 * machine's local timezone.
 */
export const formatDateUtc = (date, format) => dayjs(date).utc().format(format);
