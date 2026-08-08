import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Radio, Clock, Fingerprint } from 'lucide-react';
import { attendanceApi } from '../../api/endpoints/attendance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonText } from '../../components/ui/Skeleton';

function PunchBadge({ type }) {
  const variant = type === 'IN' ? 'success' : type === 'OUT' ? 'danger' : 'neutral';
  return <Badge variant={variant}>{type}</Badge>;
}

export default function AttendanceList() {
  const [liveRecords, setLiveRecords] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting');
  const eventSourceRef = useRef(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceApi.byDate(),
  });

  useEffect(() => {
    if (data) {
      setLiveRecords(data);
    }
  }, [data]);

  useEffect(() => {
    const es = new EventSource(attendanceApi.streamUrl());
    eventSourceRef.current = es;

    es.addEventListener('connected', () => setConnectionState('live'));
    es.addEventListener('attendance', (event) => {
      const record = JSON.parse(event.data);
      setLiveRecords((prev) => (prev.some((r) => r.id === record.id) ? prev : [record, ...prev]));
    });
    es.onerror = () => setConnectionState('disconnected');

    return () => es.close();
  }, []);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Attendance</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            Live punches from your biometric devices, today
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/attendance/devices">
            <Button variant="secondary" size="sm" icon={Fingerprint}>
              Devices
            </Button>
          </Link>
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1"
            style={{
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: connectionState === 'live' ? 'var(--hz-success-50)' : 'var(--hz-gray-100)',
              color: connectionState === 'live' ? 'var(--hz-success-600)' : 'var(--hz-text-secondary)',
            }}
          >
            <Radio size={13} />
            {connectionState === 'live' ? 'Live' : connectionState === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
          </div>
        </div>
      </div>

      <Card bodyClassName="p-0">
        {isLoading && (
          <div className="p-4">
            <SkeletonText lines={6} />
          </div>
        )}

        {isError && <ErrorState description="Couldn't load today's attendance." onRetry={refetch} />}

        {!isLoading && !isError && liveRecords.length === 0 && (
          <EmptyState
            icon={Clock}
            title="No punches yet today"
            description="As soon as someone scans their fingerprint on a mapped device, it'll show up here instantly."
          />
        )}

        {!isLoading && !isError && liveRecords.length > 0 && (
          <table className="table mb-0 align-middle">
            <thead>
              <tr style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>
                <th className="ps-4">Employee</th>
                <th>Department</th>
                <th>Punch Time</th>
                <th>Type</th>
                <th>Verify Mode</th>
                <th className="pe-4">Device</th>
              </tr>
            </thead>
            <tbody>
              {liveRecords.map((r) => (
                <tr key={r.id}>
                  <td className="ps-4">
                    {r.mapped ? (
                      <Link to={`/employees/${r.employeeId}`} className="d-flex align-items-center gap-2 text-decoration-none">
                        <Avatar name={r.employeeName} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
                            {r.employeeName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{r.employeeCode}</div>
                        </div>
                      </Link>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name="?" size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)' }}>{r.employeeName}</div>
                          <Badge variant="warning">Unmapped</Badge>
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 'var(--hz-text-sm)' }}>{r.departmentName || '—'}</td>
                  <td style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                    {new Date(r.punchTime).toLocaleTimeString()}
                  </td>
                  <td>
                    <PunchBadge type={r.punchType} />
                  </td>
                  <td style={{ fontSize: 'var(--hz-text-sm)' }}>{r.verifyMode}</td>
                  <td className="pe-4" style={{ fontSize: 'var(--hz-text-sm)' }}>
                    {r.deviceName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
