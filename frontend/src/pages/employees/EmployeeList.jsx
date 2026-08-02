import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { employeesApi } from '../../api/endpoints/employees';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { SkeletonText } from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import CreateEmployeeModal from './CreateEmployeeModal';
import { statusMeta, EMPLOYMENT_TYPE_LABEL } from './statusMeta';

export default function EmployeeList() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: employees, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => employeesApi.list(search),
  });

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Employees</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            Your organization's people, all in one place
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setShowCreate(true)}>
          Onboard Employee
        </Button>
      </div>

      <div className="position-relative" style={{ maxWidth: 360 }}>
        <Search size={16} className="position-absolute" style={{ left: 12, top: 10, color: 'var(--hz-text-muted)' }} />
        <input
          type="search"
          placeholder="Search by name, code, or email…"
          className="form-control ps-5"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card bodyClassName="p-0">
        {isLoading && (
          <div className="p-4">
            <SkeletonText lines={6} />
          </div>
        )}

        {isError && <ErrorState description="Couldn't load employees." onRetry={refetch} />}

        {!isLoading && !isError && employees?.length === 0 && (
          <EmptyState
            title={search ? 'No matches' : 'No employees yet'}
            description={search ? `Nothing matches "${search}"` : 'Onboard your first employee to populate the directory.'}
          />
        )}

        {!isLoading && !isError && employees?.length > 0 && (
          <table className="table mb-0 align-middle">
            <thead>
              <tr style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>
                <th className="ps-4">Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Manager</th>
                <th>Type</th>
                <th>Status</th>
                <th className="pe-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const meta = statusMeta(emp.status);
                return (
                  <tr key={emp.id}>
                    <td className="ps-4">
                      <Link to={`/employees/${emp.id}`} className="d-flex align-items-center gap-2 text-decoration-none">
                        <Avatar name={emp.fullName} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
                            {emp.fullName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{emp.employeeCode}</div>
                        </div>
                      </Link>
                    </td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>{emp.departmentName || '—'}</td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>{emp.designationTitle || '—'}</td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>{emp.reportingManagerName || '—'}</td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>{EMPLOYMENT_TYPE_LABEL[emp.employmentType] || emp.employmentType}</td>
                    <td>
                      <Badge variant={meta.variant} dot>
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="pe-4" style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                      {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
