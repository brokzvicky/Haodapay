import { axiosClient } from '../axiosClient';
import { toUtcIsoString } from '../../utils/formatDateTime';

/**
 * Convert the different possible backend response shapes into a plain array.
 *
 * Supported:
 * - [...]
 * - { content: [...] }                Spring Page
 * - { data: { content: [...] } }      wrapped Page
 * - { data: [...] }                   wrapped array
 */
function normalizeCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  if (Array.isArray(response?.data?.content)) {
    return response.data.content;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

/**
 * Employee Monitoring API.
 *
 * Uses the application's existing authenticated axios client.
 */
export const monitoringApi = {
  devices: async () => {
    const response = await axiosClient.get('/api/monitoring/devices');
    return normalizeCollection(response.data);
  },

  deviceById: async (id) => {
    const response = await axiosClient.get(
      `/api/monitoring/devices/${id}`
    );

    return response.data;
  },

  sessionsByDevice: async (deviceId) => {
    const response = await axiosClient.get(
      `/api/monitoring/sessions/device/${deviceId}`
    );

    return normalizeCollection(response.data);
  },

  sessionsByEmployee: async (employeeId) => {
    const response = await axiosClient.get(
      `/api/monitoring/sessions/employee/${employeeId}`
    );

    return normalizeCollection(response.data);
  },

  sessions: async (from, to) => {
    const response = await axiosClient.get(
      '/api/monitoring/sessions',
      {
        params: {
          from: from || undefined,
          to: to || undefined,
        },
      }
    );

    return normalizeCollection(response.data);
  },

  /**
   * Root fix for "Activity page shows No activity in this range" -
   * combines date range + employee + device server-side in one call
   * (backend: ActivitySessionRepository#searchPaged /
   * MonitoringQueryService#search / GET /api/monitoring/sessions/search).
   *
   * The page used to call sessionsByEmployee(employeeId) - which returns
   * only the 50 most-recent sessions for that employee, unfiltered by
   * date - and then applied the date range as a CLIENT-SIDE filter on
   * that already-truncated batch. Any date range outside those 50 most
   * recent sessions silently returned zero rows even though matching
   * data existed further back in the table. This calls the paginated,
   * server-side-filtered endpoint instead, so the date/employee/device
   * filters are always applied against the full table, not a truncated
   * page of it.
   */
  sessionsSearch: async ({ from, to, employeeId, employeeCode, deviceId, page = 0, size = 25 } = {}) => {
    const response = await axiosClient.get('/api/monitoring/sessions/search', {
      params: {
        from,
        to,
        employeeId: employeeId || undefined,
        employeeCode: employeeCode || undefined,
        deviceId: deviceId || undefined,
        page,
        size,
      },
    });
    const data = response.data;
    return {
      rows: normalizeCollection(data),
      totalElements: data?.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data?.totalPages ?? 1,
    };
  },

  // ---------------------------------------------------------------------
  // Device Assignment module
  // ---------------------------------------------------------------------

  enrollDevice: async (payload) => {
    const response = await axiosClient.post('/api/monitoring/devices', payload);
    return response.data;
  },

  updateAssignment: async (id, payload) => {
    const response = await axiosClient.put(`/api/monitoring/devices/${id}/assignment`, payload);
    return response.data;
  },

  activateDevice: (id) => axiosClient.patch(`/api/monitoring/devices/${id}/activate`),
  deactivateDevice: (id) => axiosClient.patch(`/api/monitoring/devices/${id}/deactivate`),
  rotateToken: async (id) => {
    const response = await axiosClient.post(`/api/monitoring/devices/${id}/rotate-token`);
    return response.data;
  },
  deleteDevice: (id) => axiosClient.delete(`/api/admin/devices/${id}`),
  rotateAdminToken: async (id) => {
    const response = await axiosClient.post(`/api/admin/devices/${id}/rotate-token`);
    return response.data;
  },
};

/**
 * Activity Reports / Productivity Summary / Management View / Excel & PDF
 * export - all filtered from real activity_session data server-side (see
 * MonitoringReportController). Exports go through axios (not a plain
 * <a href>) because the endpoints require the same bearer-token auth as
 * everything else in the app.
 */
export const monitoringReportsApi = {
  productivity: async (filters) => {
    const response = await axiosClient.get('/api/monitoring/reports/productivity', { params: cleanParams(filters) });
    return normalizeCollection(response.data);
  },

  management: async (filters) => {
    const response = await axiosClient.get('/api/monitoring/reports/management', { params: cleanParams(filters) });
    return response.data;
  },

  exportExcel: async (filters) => {
    const response = await axiosClient.get('/api/monitoring/reports/export/excel', {
      params: cleanParams(filters),
      responseType: 'blob',
    });
    downloadBlob(response, `productivity-report-${filters?.startDate || ''}_to_${filters?.endDate || ''}.xlsx`);
  },

  exportPdf: async (filters) => {
    const response = await axiosClient.get('/api/monitoring/reports/export/pdf', {
      params: cleanParams(filters),
      responseType: 'blob',
    });
    downloadBlob(response, `productivity-report-${filters?.startDate || ''}_to_${filters?.endDate || ''}.pdf`);
  },
};

function cleanParams(filters) {
  if (!filters) return {};
  const out = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  });
  return out;
}

function downloadBlob(axiosResponse, fallbackFilename) {
  const disposition = axiosResponse.headers?.['content-disposition'];
  const match = disposition && /filename="?([^"]+)"?/.exec(disposition);
  const filename = (match && match[1]) || fallbackFilename;

  const url = URL.createObjectURL(axiosResponse.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/* Device Assignment accessors                                                */
/* -------------------------------------------------------------------------- */

export function getDeviceHostname(device) {
  return device?.hostname ?? '—';
}

export function getDeviceSerialNumber(device) {
  return device?.serialNumber ?? '—';
}

export function getDeviceMacAddress(device) {
  return device?.macAddress ?? '—';
}

export function getDeviceAssignedDate(device) {
  return device?.assignedDate ?? null;
}

export function getDeviceEmployeeCode(device) {
  return device?.employeeCode ?? null;
}

export function getDeviceDepartment(device) {
  return device?.departmentName ?? '—';
}

export function getDeviceDesignation(device) {
  return device?.designationTitle ?? '—';
}

/* -------------------------------------------------------------------------- */
/* Productivity summary accessors                                            */
/* -------------------------------------------------------------------------- */

export function formatHoursMinutes(totalSeconds) {
  const seconds = Number(totalSeconds) || 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

/* -------------------------------------------------------------------------- */
/* Device accessors                                                           */
/* -------------------------------------------------------------------------- */

export function getDeviceId(device) {
  return device?.id ?? device?.deviceId;
}

export function getDeviceName(device) {
  return (
    device?.deviceName ??
    device?.name ??
    'Unnamed Device'
  );
}

export function getDeviceEmployeeName(device) {
  return (
    device?.employeeName ??
    device?.employee?.fullName ??
    device?.assignedEmployeeName ??
    null
  );
}

export function getDeviceEmployeeId(device) {
  return (
    device?.employeeId ??
    device?.employee?.id ??
    null
  );
}

/**
 * Heartbeat is expected every 60 seconds.
 * Allow 3 minutes before considering the device stale.
 */
const HEARTBEAT_ONLINE_WINDOW_MS = 3 * 60 * 1000;

export function isDeviceOnline(device) {
  if (typeof device?.online === 'boolean') {
    return device.online;
  }

  if (typeof device?.isOnline === 'boolean') {
    return device.isOnline;
  }

  const lastSeen = getDeviceLastSeen(device);

  if (lastSeen) {
    const lastSeenMs = new Date(lastSeen).getTime();

    if (Number.isFinite(lastSeenMs)) {
      const diffMs = Date.now() - lastSeenMs;

      return diffMs >= 0 && diffMs <= HEARTBEAT_ONLINE_WINDOW_MS;
    }
  }

  if (typeof device?.status === 'string') {
    return !['OFFLINE', 'DISCONNECTED'].includes(device.status.toUpperCase());
  }

  return false;
}

export function getDeviceLastSeen(device) {
  return toUtcIsoString(
    device?.lastSeenAt ??
      device?.lastHeartbeatAt ??
      device?.lastHeartbeat ??
      device?.lastSeen ??
      device?.lastSeenUtc ??
      device?.lastHeartbeatUtc ??
      null
  );
}

export function getDeviceOS(device) {
  return (
    device?.operatingSystem ??
    device?.os ??
    device?.osVersion ??
    '—'
  );
}

export function getDeviceAgentVersion(device) {
  return (
    device?.agentVersion ??
    device?.version ??
    '—'
  );
}

/* -------------------------------------------------------------------------- */
/* Session accessors                                                          */
/* -------------------------------------------------------------------------- */

export function getSessionId(session) {
  return session?.id ?? session?.sessionId;
}

export function getSessionEmployeeName(session) {
  return (
    session?.employeeName ??
    session?.employee?.fullName ??
    '—'
  );
}

export function getSessionEmployeeId(session) {
  return (
    session?.employeeId ??
    session?.employee?.id ??
    null
  );
}

export function getSessionDeviceName(session) {
  return (
    session?.deviceName ??
    session?.device?.deviceName ??
    '—'
  );
}

export function getSessionDeviceId(session) {
  return (
    session?.deviceId ??
    session?.device?.id ??
    null
  );
}

export function getSessionApp(session) {
  return (
    session?.applicationName ??
    session?.appName ??
    session?.application ??
    'Unknown App'
  );
}

export function getSessionWindowTitle(session) {
  return (
    session?.windowTitle ??
    session?.title ??
    '—'
  );
}

export function getSessionStart(session) {
  return toUtcIsoString(
    session?.startTime ??
      session?.startedAt ??
      session?.start ??
      null
  );
}

export function getSessionEnd(session) {
  return toUtcIsoString(
    session?.endTime ??
      session?.endedAt ??
      session?.end ??
      null
  );
}

export function getSessionDurationSeconds(session) {
  if (typeof session?.durationSeconds === 'number') {
    return session.durationSeconds;
  }

  if (typeof session?.duration === 'number') {
    return session.duration;
  }

  const start = getSessionStart(session);
  const end = getSessionEnd(session);

  if (start && end) {
    const seconds =
      (new Date(end).getTime() -
        new Date(start).getTime()) /
      1000;

    return Number.isFinite(seconds) && seconds > 0
      ? seconds
      : 0;
  }

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Aggregation                                                                */
/* -------------------------------------------------------------------------- */

export function aggregateSessionsByApp(
  sessions,
  limit = 5
) {
  const safeSessions = Array.isArray(sessions)
    ? sessions
    : [];

  const totals = new Map();

  for (const session of safeSessions) {
    const app = getSessionApp(session);

    totals.set(
      app,
      (totals.get(app) || 0) +
        getSessionDurationSeconds(session)
    );
  }

  return Array.from(totals.entries())
    .map(([applicationName, seconds]) => ({
      applicationName,
      seconds,
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}