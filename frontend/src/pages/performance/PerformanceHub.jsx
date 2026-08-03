import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Target, Star } from 'lucide-react';
import { goalsApi, performanceReviewsApi } from '../../api/endpoints/performance';
import { employeesApi } from '../../api/endpoints/employees';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonText } from '../../components/ui/Skeleton';

const TABS = [
  { key: 'goals', label: 'Goals' },
  { key: 'reviews', label: 'Performance Reviews' },
];

const GOAL_STATUS_VARIANT = { NOT_STARTED: 'neutral', IN_PROGRESS: 'info', AT_RISK: 'danger', COMPLETED: 'success' };
const REVIEW_STATUS_VARIANT = { DRAFT: 'neutral', SUBMITTED: 'warning', ACKNOWLEDGED: 'success' };

export default function PerformanceHub() {
  const [tab, setTab] = useState('goals');

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Performance</h1>
        <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
          Goals, reviews, and feedback
        </p>
      </div>

      <div className="d-flex gap-2" style={{ borderBottom: '1px solid var(--hz-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn border-0 rounded-0 px-3 py-2"
            style={{
              fontSize: 'var(--hz-text-sm)',
              fontWeight: 600,
              color: tab === t.key ? 'var(--hz-primary-700)' : 'var(--hz-text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--hz-primary-600)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'goals' && <GoalsPanel />}
      {tab === 'reviews' && <ReviewsPanel />}
    </div>
  );
}

function GoalsPanel() {
  const [employeeId, setEmployeeId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', targetDate: '' });
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', employeeId],
    queryFn: () => goalsApi.byEmployee(employeeId),
    enabled: !!employeeId,
  });

  const create = useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', employeeId] });
      setForm({ title: '', description: '', targetDate: '' });
      setShowForm(false);
    },
  });

  const updateProgress = useMutation({
    mutationFn: ({ id, progressPercent, status }) => goalsApi.updateProgress(id, { progressPercent, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', employeeId] }),
  });

  return (
    <Card
      title="Goals"
      actions={
        employeeId && (
          <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : 'Add Goal'}
          </Button>
        )
      }
    >
      <div className="mb-3" style={{ maxWidth: 320 }}>
        <select className="form-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Select an employee…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.fullName}
            </option>
          ))}
        </select>
      </div>

      {!employeeId && <EmptyState icon={Target} title="Pick an employee" description="Select someone above to view or set their goals." />}

      {employeeId && showForm && (
        <form
          className="row g-2 align-items-end mb-4 pb-3"
          style={{ borderBottom: '1px solid var(--hz-border)' }}
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ ...form, employeeId: Number(employeeId), targetDate: form.targetDate || null });
          }}
        >
          <div className="col-4">
            <input className="form-control" placeholder="Goal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="col-4">
            <input className="form-control" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="col-2">
            <input type="date" className="form-control" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </div>
          <div className="col-2">
            <Button type="submit" size="sm" loading={create.isPending} className="w-100 justify-content-center">
              Add
            </Button>
          </div>
        </form>
      )}

      {employeeId && isLoading && <SkeletonText lines={3} />}
      {employeeId && !isLoading && goals?.length === 0 && <EmptyState icon={Target} title="No goals set" description="Add one above." />}
      {employeeId &&
        !isLoading &&
        goals?.map((g) => (
          <div key={g.id} className="py-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600 }}>{g.title}</span>
              <Badge variant={GOAL_STATUS_VARIANT[g.status]}>{g.status.replace('_', ' ')}</Badge>
            </div>
            {g.description && <p style={{ fontSize: 13, color: 'var(--hz-text-secondary)', marginBottom: 8 }}>{g.description}</p>}
            <div className="d-flex align-items-center gap-2">
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--hz-gray-100)' }}>
                <div style={{ height: 6, borderRadius: 999, width: `${g.progressPercent}%`, background: 'var(--hz-primary-500)' }} />
              </div>
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={g.progressPercent}
                className="form-control form-control-sm"
                style={{ width: 70 }}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  const status = val >= 100 ? 'COMPLETED' : val > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
                  if (val !== g.progressPercent) updateProgress.mutate({ id: g.id, progressPercent: val, status });
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>%</span>
            </div>
          </div>
        ))}
    </Card>
  );
}

function ReviewsPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', reviewerId: '', reviewPeriod: '', rating: 3, strengths: '', areasForImprovement: '' });

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });
  const { data: reviews, isLoading } = useQuery({ queryKey: ['performance-reviews'], queryFn: performanceReviewsApi.list });

  const create = useMutation({
    mutationFn: performanceReviewsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
      setShowForm(false);
    },
  });
  const submit = useMutation({
    mutationFn: performanceReviewsApi.submit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['performance-reviews'] }),
  });

  return (
    <Card
      title="Performance Reviews"
      actions={
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : 'New Review'}
        </Button>
      }
    >
      {showForm && (
        <form
          className="mb-4 pb-3"
          style={{ borderBottom: '1px solid var(--hz-border)' }}
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ ...form, employeeId: Number(form.employeeId), reviewerId: form.reviewerId || null, rating: Number(form.rating) });
          }}
        >
          <div className="row g-2 mb-2">
            <div className="col-4">
              <select className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                <option value="">Employee…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
            <div className="col-3">
              <input className="form-control" placeholder="Period (e.g. 2026 H1)" value={form.reviewPeriod} onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })} required />
            </div>
            <div className="col-2">
              <select className="form-select" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </div>
            <div className="col-3">
              <select className="form-select" value={form.reviewerId} onChange={(e) => setForm({ ...form, reviewerId: e.target.value })}>
                <option value="">Reviewer…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea className="form-control mb-2" rows={2} placeholder="Strengths" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
          <textarea className="form-control mb-2" rows={2} placeholder="Areas for improvement" value={form.areasForImprovement} onChange={(e) => setForm({ ...form, areasForImprovement: e.target.value })} />
          <Button type="submit" size="sm" loading={create.isPending}>
            Save Draft
          </Button>
        </form>
      )}

      {isLoading && <SkeletonText lines={4} />}
      {!isLoading && reviews?.length === 0 && <EmptyState icon={Star} title="No reviews yet" />}
      {!isLoading &&
        reviews?.map((r) => (
          <div key={r.id} className="d-flex align-items-center justify-content-between py-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
            <Link to={`/employees/${r.employeeId}`} className="d-flex align-items-center gap-2 text-decoration-none">
              <Avatar name={r.employeeName} size="sm" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>{r.employeeName}</div>
                <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
                  {r.reviewPeriod} {r.rating ? `· ${r.rating}/5` : ''}
                </div>
              </div>
            </Link>
            <div className="d-flex align-items-center gap-2">
              <Badge variant={REVIEW_STATUS_VARIANT[r.status]}>{r.status}</Badge>
              {r.status === 'DRAFT' && (
                <Button size="sm" variant="secondary" onClick={() => submit.mutate(r.id)} loading={submit.isPending}>
                  Submit
                </Button>
              )}
            </div>
          </div>
        ))}
    </Card>
  );
}
