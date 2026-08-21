import { axiosClient } from '../axiosClient';

/**
 * Employee Monitoring API - talks to the Spring Boot monitoring backend
 * through the app's existing authenticated axios instance (same JWT/refresh
 * flow as every other endpoint module). No separate axios instance, no
 * separate auth handling.
 */
export const monitoringApi = {
  devices: () => axiosClient.get('/api/monitoring/devices').then((res) => res.data),
  deviceById: (id) => axiosClient.get(`/api/monitoring/devices/${id}`).then((res) => res.data),
  sessionsByDevice: (deviceId) => axiosClient.get(`/api/monitoring/sessions/device/${deviceId}`).then((res) => res.data),
  sessionsByEmployee: (employeeId) => axiosClient.get(`/api/monitoring/sessions/employee/${employeeId}`).then((res) => res.data),
  /** `from`/`to` are ISO UTC instants. Both are optional per the backend contract. */
  sessions: (from, to) =>
    axiosClient.get('/api/monitoring/sessions', { params: { from: from || undefined, to: to || undefined } }).then((res) => res.data),
};

/**
 * The monitoring DTO field names weren't specified alongside the endpoint
 * list, so these accessors fall back across the common shapes a Spring Boot
 * DTO for this data is likely to use. Centralizing the fallback chains here
 * (instead of scattering `??` chains through every page) means there's one
 * place to trim once the real DTO shapes are confirmed against the backend.
 */
export function getDeviceId(d) {
  return d?.id ?? d?.deviceId;
}
export function getDeviceName(d) {
  return d?.deviceName ?? d?.name ?? 'Unnamed Device';
}
export function getDeviceEmployeeName(d) {
  return d?.employeeName ?? d?.employee?.fullName ?? d?.assignedEmployeeName ?? null;
}
export function getDeviceEmployeeId(d) {
  return d?.employeeId ?? d?.employee?.id ?? null;
}
export function isDeviceOnline(d) {
  if (typeof d?.online === 'boolean') return d.online;
  if (typeof d?.isOnline === 'boolean') return d.isOnline;
  if (typeof d?.status === 'string') return d.status.toUpperCase() === 'ONLINE';
  return false;
}
export function getDeviceLastSeen(d) {
  return d?.lastSeenAt ?? d?.lastHeartbeatAt ?? d?.lastHeartbeat ?? d?.lastSeen ?? null;
}
export function getDeviceOS(d) {
  return d?.operatingSystem ?? d?.os ?? d?.osVersion ?? '—';
}
export function getDeviceAgentVersion(d) {
  return d?.agentVersion ?? d?.version ?? '—';
}

export function getSessionId(s) {
  return s?.id ?? s?.sessionId;
}
export function getSessionEmployeeName(s) {
  return s?.employeeName ?? s?.employee?.fullName ?? '—';
}
export function getSessionEmployeeId(s) {
  return s?.employeeId ?? s?.employee?.id ?? null;
}
export function getSessionDeviceName(s) {
  return s?.deviceName ?? s?.device?.deviceName ?? '—';
}
export function getSessionDeviceId(s) {
  return s?.deviceId ?? s?.device?.id ?? null;
}
export function getSessionApp(s) {
  return s?.applicationName ?? s?.appName ?? s?.application ?? 'Unknown App';
}
export function getSessionWindowTitle(s) {
  return s?.windowTitle ?? s?.title ?? '—';
}
export function getSessionStart(s) {
  return s?.startTime ?? s?.startedAt ?? s?.start ?? null;
}
export function getSessionEnd(s) {
  return s?.endTime ?? s?.endedAt ?? s?.end ?? null;
}
export function getSessionDurationSeconds(s) {
  if (typeof s?.durationSeconds === 'number') return s.durationSeconds;
  if (typeof s?.duration === 'number') return s.duration;
  const start = getSessionStart(s);
  const end = getSessionEnd(s);
  if (start && end) {
    const seconds = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  }
  return 0;
}

/** Sums session duration per application, sorted descending - powers the "Top Applications" panels. */
export function aggregateSessionsByApp(sessions, limit = 5) {
  const totals = new Map();
  for (const s of sessions || []) {
    const app = getSessionApp(s);
    totals.set(app, (totals.get(app) || 0) + getSessionDurationSeconds(s));
  }
  return Array.from(totals.entries())
    .map(([applicationName, seconds]) => ({ applicationName, seconds }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}
