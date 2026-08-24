/**
 * Backend/DB timestamps are stored and returned in UTC. Every helper in this
 * file is purely a *display* concern - nothing here mutates or re-stores a
 * timestamp, it only formats a UTC instant for an Asia/Kolkata viewer.
 *
 * Asia/Kolkata has a fixed +05:30 offset with no DST, so we can safely use
 * Intl's IANA timezone support for display and simple offset arithmetic for
 * computing "today in IST" query boundaries.
 */
const IST_TIME_ZONE = 'Asia/Kolkata';

/**
 * THE TIMESTAMP CONTRACT: every timestamp the monitoring API returns is UTC.
 * This is the one place that turns an API timestamp value into an absolute
 * instant - every other helper in this file, and every accessor in
 * api/endpoints/monitoring.js, routes through this function. Don't call
 * `new Date(apiValue)` anywhere else in the monitoring UI; call this.
 *
 * Why this function exists: an ISO-8601 string with an explicit UTC
 * designator ("...Z" or "...+00:00") parses correctly everywhere. But a
 * *bare* LocalDateTime string with no zone/offset at all - e.g.
 * "2026-08-21T10:47:00", which is what Jackson emits by default for a
 * java.time.LocalDateTime field - does NOT parse as UTC. Per the ECMAScript
 * date-time string spec, a date-time with no offset is parsed as the
 * *browser's local time*. On a machine whose local zone is Asia/Kolkata,
 * "2026-08-21T10:47:00" (meant to be 10:47 UTC) gets read as 10:47 IST -
 * five and a half hours off, which is exactly the "Last seen 7h ago for a
 * heartbeat that just arrived" bug. The real fix is on the backend
 * (serialize an actual UTC instant with an explicit offset - see the
 * accompanying backend notes); this function is the frontend's half of
 * that contract, and a safety net for any bare-LocalDateTime string that
 * slips through in the meantime.
 */
const HAS_TIMEZONE_DESIGNATOR = /(Z|[+-]\d{2}:?\d{2})$/;

export function parseApiTimestamp(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === 'number') {
    // Epoch millis - already an absolute instant, nothing to normalize.
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value !== 'string') return null;

  // Only append "Z" when the string carries no zone/offset of its own -
  // never touch a value that's already explicit, and never do manual
  // millisecond/offset arithmetic. `Date` itself does the timezone-aware
  // conversion once the string unambiguously states its zone.
  const normalized = HAS_TIMEZONE_DESIGNATOR.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Returns a proper absolute-instant ISO string ("...Z") for any API timestamp value - UTC in, UTC out, safe to re-parse anywhere downstream. */
export function toUtcIsoString(value) {
  const date = parseApiTimestamp(value);
  return date ? date.toISOString() : null;
}

function toDate(value) {
  return parseApiTimestamp(value);
}

/** e.g. "21 Aug 2026, 3:45 PM" */
export function formatDateTimeIST(value) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** e.g. "21 Aug 2026" */
export function formatDateIST(value) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** e.g. "3:45 PM" */
export function formatTimeIST(value) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Relative "time ago" for last-seen/heartbeat columns, e.g. "5m ago". */
export function timeAgoIST(value) {
  const date = toDate(value);
  if (!date) return 'Never';
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 0) return formatDateTimeIST(value);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDateIST(value);
}

/** Seconds -> "1h 12m" / "12m 4s" / "4s". */
export function formatDurationShort(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/**
 * UTC instant boundaries for "today" as measured in Asia/Kolkata, suitable
 * for passing straight into the `from`/`to` params of
 * GET /api/monitoring/sessions. Stored timestamps never change - only the
 * window we ask the backend to filter by is timezone-aware.
 */
export function todayRangeIST() {
  const nowIstDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // "2026-08-21"

  const from = new Date(`${nowIstDateStr}T00:00:00.000+05:30`);
  const to = new Date(`${nowIstDateStr}T23:59:59.999+05:30`);
  return { from: from.toISOString(), to: to.toISOString(), istDate: nowIstDateStr };
}

/** yyyy-mm-dd (IST) for a UTC instant - used to pre-fill <input type="date"> filters. */
export function toISTDateInputValue(value) {
  const date = toDate(value) || new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Converts a yyyy-mm-dd (IST) date-input value into a UTC ISO start/end-of-day instant. */
export function istDateInputToUtcRange(dateStr) {
  if (!dateStr) return { from: undefined, to: undefined };
  const from = new Date(`${dateStr}T00:00:00.000+05:30`);
  const to = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { from: from.toISOString(), to: to.toISOString() };
}
