import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { employeesApi } from '../../api/endpoints/employees';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Table from '../../components/ui/Table';
import CreateEmployeeModal from './CreateEmployeeModal';
import { statusMeta, EMPLOYMENT_TYPE_LABEL } from './statusMeta';

const COLUMNS = [
  {
    key: 'employee',
    label: 'Employee',
    headerClassName: 'ps-4',
    className: 'ps-4',
    render: (emp) => (
      <Link to={`/employees/${emp.id}`} className="d-flex align-items-center gap-2 text-decoration-none">
        <Avatar name={emp.fullName} size="sm" />
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
            {emp.fullName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{emp.employeeCode}</div>
        </div>
      </Link>
    ),
  },
  { key: 'department', label: 'Department', render: (emp) => emp.departmentName || '—' },
  { key: 'designation', label: 'Designation', render: (emp) => emp.designationTitle || '—' },
  { key: 'manager', label: 'Manager', render: (emp) => emp.reportingManagerName || '—' },
  {
    key: 'type',
    label: 'Type',
    render: (emp) => EMPLOYMENT_TYPE_LABEL[emp.employmentType] || emp.employmentType,
  },
  {
    key: 'status',
    label: 'Status',
    render: (emp) => {
      const meta = statusMeta(emp.status);
      return (
        <Badge variant={meta.variant} dot>
          {meta.label}
        </Badge>
      );
    },
  },
  {
    key: 'joined',
    label: 'Joined',
    headerClassName: 'pe-4',
    className: 'pe-4',
    render: (emp) => (emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '—'),
    style: { color: 'var(--hz-text-secondary)' },
  },
];

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
        <Table
          columns={COLUMNS}
          rows={employees}
          getRowKey={(emp) => emp.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyTitle={search ? 'No matches' : 'No employees yet'}
          emptyDescription={search ? `Nothing matches "${search}"` : 'Onboard your first employee to populate the directory.'}
        />
      </Card>

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
