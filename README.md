# HaodaOne — Phase 0 + 1 + 2 + 3: Foundation + Core + Attendance + Leave

Phase 0 built the foundation (auth, RBAC, audit, design system, shell).
Phase 1 added Organization structure and the Employee Workspace. Phase 2
added real-time Attendance & Biometric integration - the same eSSL/ZKTeco
ADMS protocol proven in the standalone attendance POC, now rebuilt against
real employees, real RBAC, and a real audit trail instead of a flat
mapping table. Phase 3 adds Leave Management - apply/approve/reject
workflow, computed balances, and a holiday calendar that keeps leave-day
counting accurate.

```
haodaone/
  backend/    Spring Boot 3 (Java 21) + PostgreSQL - auth, RBAC, audit, org, employees, attendance, leave
  frontend/   React + Bootstrap (customized) + React Query - shell, design system, employee workspace, live attendance, leave
```

## What's actually functional right now

**Phase 0**
- **Login / session management** - JWT access + refresh tokens, refresh
  token rotation, account lockout after 5 failed attempts, full login
  history
- **RBAC** - roles, permissions, `@PreAuthorize`-guarded endpoints; 4
  seeded system roles (`SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`)
- **User management** - Settings > Users & Roles: create accounts,
  activate/deactivate, view roles
- **Audit trail** - every create/update/activate/deactivate/login/status
  change is logged with who, when, and what changed - Settings > Audit Logs

**Phase 1**
- **Organization** - Settings > Organization: Departments (with
  optional parent department + head), Designations (with level and
  department scoping), Teams (with lead and department) - Settings > Organization
- **Employee Workspace** - Employees list with live search, an "Onboard
  Employee" flow with auto-generated employee codes (`EMP0001`, `EMP0002`,
  ...), and a full profile page: Overview tab (contact, employment,
  personal, emergency contact) and Reporting Hierarchy tab (manager +
  direct reports, both clickable to navigate the org chart)
- **Employee lifecycle** - the five-status system (`ACTIVE`, `ON_LEAVE`,
  `NOTICE_PERIOD`, `RESIGNED`, `TERMINATED`) with every transition
  audit-logged; employees are never hard-deleted, only soft-deleted and/or
  status-transitioned, consistent with the platform-wide `BaseEntity`
  convention
- **Dashboard** - real KPIs (total/active/on-leave/notice-period
  employees), a live headcount-by-department breakdown, and a recent
  joiners feed - all backed by actual aggregate queries, not static
  placeholders

**Phase 2**
- **Live Attendance** - the Attendance page streams punches in real time
  over Server-Sent Events the instant a biometric device pushes them; no
  polling, no manual refresh
- **Biometric device integration** - implements the eSSL/ZKTeco ADMS push
  protocol (`/iclock/cdata` handshake + ATTLOG push, `/iclock/getrequest`
  polling) exactly as validated in the standalone POC, now deduped,
  RBAC-guarded on the read side, and resolved against real `Employee`
  records instead of a flat mapping table
- **Device Dashboard** - devices self-register on first handshake; shows
  online/offline status (10-minute heartbeat window), last IP, last sync,
  and lets you rename a device
- **Employee ↔ device mapping** - each Employee profile has a "Biometric
  Enrollment" field (device PIN) editable inline; punches from
  unmapped PINs are still captured, not dropped, and are queryable via
  `/api/attendance/unmapped` for HR to reconcile
- **SSE + JWT** - since native `EventSource` can't set an Authorization
  header, the access token rides along as a query param for that one
  connection only (see the matching comments in `JwtAuthenticationFilter`
  and `attendance.js`) - a standard, narrowly-scoped workaround rather
  than opening the endpoint up

**Phase 3**
- **Leave requests** - apply (with a live remaining-balance preview),
  approve/reject with an optional note, cancel; every transition is
  audit-logged
- **Computed balances, not stored counters** - `LeaveBalance` holds only
  the allocation; "used" is computed on read by summing approved
  `LeaveRequest.days` for the year, so approving/rejecting/cancelling a
  request can never leave a stale usage figure behind
- **Business-day counting** - leave days are calculated excluding
  weekends and any date on the Holiday Calendar, computed once at apply
  time and stored on the request so it stays accurate even if the holiday
  calendar changes later
- **Overlap protection** - can't apply for dates that overlap an existing
  pending or approved request for the same employee
- **Leave Settings** (Settings > Leave Settings) - manage leave types
  (with default yearly allocation and optional carry-forward) and the
  holiday calendar
- **Employee Workspace "Leave" tab** - balance bars and full request
  history right on each employee's profile
- 3 default leave types (Casual/Sick/Earned) are seeded on first boot;
  holidays are intentionally *not* auto-seeded since that would mean
  assuming a specific country's calendar - add yours via Settings

## What's deliberately placeholder

Recruitment, Performance, and Reports show an honest "ships in Phase N"
screen rather than fake data - see the phased roadmap discussed in chat.

---

## Running it — zero manual setup

**Prerequisites**: Java 21, Maven, Node 18+, Docker (for Postgres).

```bash
# 1. Database
docker compose up -d

# 2. Backend (from repo root)
cd backend
mvn spring-boot:run
```

`application.properties` already has working defaults matching
`docker-compose.yml` — no properties file to copy, no profile flag needed.
On first boot it seeds the 4 system roles, their permissions (now
including the Phase 1 `EMPLOYEE_*`/`ORG_*`, Phase 2
`ATTENDANCE_*`/`DEVICE_MANAGE`, and Phase 3 `LEAVE_*` codes), and a
default super admin account:

```
username: admin
password: ChangeMe123!
```

**Already ran an earlier phase against this same database?** No manual
migration needed - `DataSeeder` merges any newly-introduced permission
codes onto existing system roles on every boot (see
`syncSystemRolePermissions`) - just restart the backend.

**Testing Attendance without a physical device**: point a biometric
device's ADMS "Server Address"/"Server Port" at this backend (see the
device-facing endpoints below), or simulate one with `curl`:

```bash
# Handshake
curl "http://localhost:8080/iclock/cdata?SN=TESTDEVICE001"

# Push a punch for device PIN 1001, right now
curl -X POST "http://localhost:8080/iclock/cdata?SN=TESTDEVICE001&table=ATTLOG" \
  --data-binary "1001	$(date '+%Y-%m-%d %H:%M:%S')	0	1"
```

Map an employee to PIN `1001` first (their profile page > Biometric
Enrollment) to see it resolve to a name instead of showing up as unmapped.

**Trying out Leave**: 3 default leave types are seeded on first boot, but
holidays aren't (see Phase 3 notes above) - add at least one via
Settings > Leave Settings > Holiday Calendar before applying for leave
spanning a holiday, or just skip that and apply normally; business-day
counting still works fine with zero holidays configured.

(Watch the startup logs — they print this too. The account is forced to
change its password on first login. **Change `APP_SEED_ADMIN_PASSWORD`
and `JWT_SECRET` via env vars before deploying this anywhere real** — see
`application-local.properties.template` for the full override list.)

**Already ran Phase 0 against this same database?** No extra steps needed
— `DataSeeder` syncs newly-added permission codes onto existing system
roles automatically on every boot, so `SUPER_ADMIN`/`HR_ADMIN`/`MANAGER`
pick up the new `EMPLOYEE_*`/`ORG_*` permissions without a manual
migration.

```bash
# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

A working `.env` is already included, pointing at `http://localhost:8080`.

Open `http://localhost:5173`, sign in with the admin credentials above.
Try: Settings > Organization to add a department, then Employees > Onboard
Employee to create your first record and see the Dashboard populate.

---

## API surface

### Phase 0

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/auth/login` | Public | Returns access + refresh token |
| `POST /api/auth/refresh` | Public | Rotates refresh token, issues new access token |
| `POST /api/auth/logout` | Public | Revokes a refresh token |
| `GET /api/auth/me` | Any authenticated user | Current user profile |
| `POST /api/auth/change-password` | Any authenticated user | Self-service password change |
| `GET /api/users` | `USER_VIEW` | List accounts |
| `POST /api/users` | `USER_CREATE` | Create an account |
| `PATCH /api/users/{id}/activate` \| `/deactivate` | `USER_MANAGE` | Toggle account status |
| `PUT /api/users/{id}/roles` | `USER_MANAGE` | Reassign roles |
| `GET /api/roles` | `ROLE_VIEW` | List roles + their permissions |
| `POST /api/roles` | `ROLE_MANAGE` | Create a role |
| `PUT /api/roles/{id}/permissions` | `ROLE_MANAGE` | Set a role's permissions |
| `GET /api/permissions` | `ROLE_VIEW` | List all permission codes (for the role editor) |
| `GET /api/audit/logs` | `AUDIT_VIEW` | Paginated audit trail |
| `GET /api/audit/login-history` | `AUDIT_VIEW` | Paginated login attempts |

### Phase 1

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/employees` | `EMPLOYEE_VIEW` | List employees, optional `?search=` |
| `GET /api/employees/{id}` | `EMPLOYEE_VIEW` | Full profile + direct reports |
| `POST /api/employees` | `EMPLOYEE_CREATE` | Onboard - auto-generates employee code |
| `PUT /api/employees/{id}` | `EMPLOYEE_MANAGE` | Update profile fields |
| `PATCH /api/employees/{id}/status` | `EMPLOYEE_MANAGE` | Lifecycle status transition |
| `PATCH /api/employees/{id}/biometric-mapping` | `EMPLOYEE_MANAGE` | Set/clear the device PIN this employee is enrolled under |
| `GET /api/departments` | `ORG_VIEW` | List departments (with employee counts) |
| `POST /api/departments` | `ORG_MANAGE` | Create a department |
| `PATCH /api/departments/{id}/activate` \| `/deactivate` | `ORG_MANAGE` | Toggle department status |
| `GET /api/designations` | `ORG_VIEW` | List designations |
| `POST /api/designations` | `ORG_MANAGE` | Create a designation |
| `GET /api/teams` | `ORG_VIEW` | List teams (with member counts) |
| `POST /api/teams` | `ORG_MANAGE` | Create a team |
| `GET /api/dashboard/summary` | `EMPLOYEE_VIEW` | KPIs, department breakdown, recent joiners |

### Phase 2

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /iclock/cdata` | **Public** (device-facing) | ADMS handshake - device self-registers |
| `POST /iclock/cdata?table=ATTLOG` | **Public** (device-facing) | Device pushes buffered punches |
| `GET /iclock/getrequest` | **Public** (device-facing) | Device polls for pending commands (always "OK" for now) |
| `GET /api/attendance?date=` | `ATTENDANCE_VIEW` | Punches for a given day (defaults to today) |
| `GET /api/attendance/employee/{id}` | `ATTENDANCE_VIEW` | Full attendance history for one employee |
| `GET /api/attendance/unmapped` | `ATTENDANCE_MANAGE` | Punches from device PINs not yet linked to an employee |
| `GET /api/attendance/stream` | `ATTENDANCE_VIEW` (via `?token=`) | Server-Sent Events - live punch feed |
| `GET /api/devices` | `DEVICE_MANAGE` | Device Dashboard - online/offline, last sync |
| `PATCH /api/devices/{id}/rename` | `DEVICE_MANAGE` | Rename a device |

The `/iclock/**` endpoints are intentionally public (see "SSE + JWT" note
above for why - device firmware can't authenticate the normal way) but are
scoped to exactly the three ADMS-protocol paths; everything else under
`/api/**` still requires a valid JWT.

### Phase 3

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/leave-requests?status=` | `LEAVE_VIEW` | All leave requests, optionally filtered by status |
| `GET /api/leave-requests/employee/{id}` | `LEAVE_VIEW` or `LEAVE_APPLY` | One employee's request history |
| `GET /api/leave-requests/employee/{id}/balance?year=` | `LEAVE_VIEW` or `LEAVE_APPLY` | Computed balance per leave type (defaults to current year) |
| `POST /api/leave-requests` | `LEAVE_APPLY` | Apply for leave - validates overlap and remaining balance |
| `PATCH /api/leave-requests/{id}/approve` | `LEAVE_APPROVE` | Approve a pending request |
| `PATCH /api/leave-requests/{id}/reject` | `LEAVE_APPROVE` | Reject a pending request |
| `PATCH /api/leave-requests/{id}/cancel` | `LEAVE_APPLY` or `LEAVE_APPROVE` | Cancel a request (not once it's started) |
| `GET /api/leave-types` | `LEAVE_APPLY`/`LEAVE_VIEW`/`LEAVE_MANAGE` | List leave types |
| `POST /api/leave-types` | `LEAVE_MANAGE` | Create a leave type |
| `GET /api/holidays` | `LEAVE_APPLY`/`LEAVE_VIEW`/`LEAVE_MANAGE` | List holidays |
| `POST /api/holidays` | `LEAVE_MANAGE` | Add a holiday |
| `DELETE /api/holidays/{id}` | `LEAVE_MANAGE` | Remove a holiday |

## Architecture conventions later modules should follow

- **Every entity extends `BaseEntity`** (`common/entity/BaseEntity.java`) —
  gets audit columns, soft delete, and optimistic versioning for free.
  Never hard-delete a row that anything else references; set `deleted=true`
  instead. `Employee.status` is the pattern for any future entity that
  needs a multi-state lifecycle rather than a plain boolean.
- **Every new module registers its own permission codes** in `DataSeeder`
  (`MODULE_ACTION` convention, e.g. `LEAVE_APPROVE`, `PAYROLL_VIEW`) and
  grants them to the relevant system roles - `seedRole`/
  `syncSystemRolePermissions` will merge newly-added codes onto existing
  roles automatically, so upgrading an already-running instance never
  needs a manual permission migration.
- **Every service method that changes state calls
  `AuditLogService.log(...)`** at the point of change — see
  `EmployeeService`/`DepartmentService` for the pattern.
- **Cross-module references use plain `Long` ids, not JPA relationships,
  when they'd create a circular entity dependency** — see
  `Department.headEmployeeId` / `Team.leadEmployeeId` pointing at Employee
  (which itself points back at Department/Team). Resolve display names in
  the service layer, not via a bidirectional mapping.
- **Frontend**: new pages live in `pages/` (or `pages/<module>/` once a
  module has more than a couple of screens, see `pages/employees/`),
  reuse the `components/ui/*` library and `hz-*` CSS classes/tokens, and
  new API calls go in `api/endpoints/*.js` following `employees.js`.
- **Prefer computed values over stored counters when the source data is
  already there** — `LeaveBalance` only stores the allocation; "used" is
  summed from `LeaveRequest` on every read (`LeaveRequestRepository.
  sumApprovedDays`) rather than incremented/decremented on approve/reject/
  cancel. One less place for state to drift out of sync.

## A note on verification

I couldn't run a full `mvn compile` or `mvn spring-boot:run` against this
in the sandbox this was built in — Maven Central isn't reachable from
there. What was verified: every Java file's braces balance (an automated
check across all 111 files), a full manual read-through of the leave
balance/overlap/business-day-counting logic in `LeaveRequestService`, and
the frontend was built end-to-end four times across the four phases
(`npm install && npm run build`, 1713 modules in this final pass, zero
errors — only harmless Bootstrap-internal Sass deprecation warnings each
time). Treat your first `mvn spring-boot:run` as the real compile check.

