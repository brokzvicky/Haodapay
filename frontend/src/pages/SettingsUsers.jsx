import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { usersApi } from '../api/endpoints/users';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Dialog from '../components/ui/Dialog';
import FormField from '../components/ui/FormField';
import { SkeletonText } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';

export default function SettingsUsers() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }) => (active ? usersApi.deactivate(id) : usersApi.activate(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Users & Roles</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            Manage who can sign in to HaodaOne and what they're allowed to do
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setShowCreate(true)}>
          New User
        </Button>
      </div>

      <Card bodyClassName="p-0">
        {isLoading && (
          <div className="p-4">
            <SkeletonText lines={5} />
          </div>
        )}

        {isError && <ErrorState description="Couldn't load users - you may not have permission, or the server is unreachable." onRetry={refetch} />}

        {!isLoading && !isError && users?.length === 0 && (
          <EmptyState title="No users yet" description="Create the first account to get your team into HaodaOne." />
        )}

        {!isLoading && !isError && users?.length > 0 && (
          <table className="table mb-0 align-middle">
            <thead>
              <tr style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>
                <th className="ps-4">User</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-2">
                      <Avatar name={u.fullName} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)' }}>{u.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {u.roles.map((r) => (
                        <Badge key={r} variant="primary">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge variant={u.active ? 'success' : 'neutral'} dot>
                      {u.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="text-end pe-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={toggleActive.isPending && toggleActive.variables?.id === u.id}
                      onClick={() => toggleActive.mutate({ id: u.id, active: u.active })}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateUserModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ username: '', email: '', fullName: '', temporaryPassword: '' });
  const [error, setError] = useState(null);

  const createUser = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not create user'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    createUser.mutate(form);
  }

  return (
    <Dialog open onClose={onClose} title="New User" size="sm">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}
        <FormField label="Full Name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
        <FormField label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} required />
        <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <FormField
          label="Temporary Password"
          type="password"
          value={form.temporaryPassword}
          onChange={(v) => setForm({ ...form, temporaryPassword: v })}
          required
        />
        <p style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
          The new user will be prompted to change this password on first login. New accounts default to the Employee role.
        </p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createUser.isPending}>
            Create User
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
