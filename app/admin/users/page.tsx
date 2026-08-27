/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  UserX,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminUserListItem,
  AdminUserRole,
  AdminUserService,
} from '@/lib/supabase/adminUserService';

/* =========================================================
 * TYPES
 * ======================================================= */

type RoleFilter =
  | 'ALL'
  | AdminUserRole;

type StatusFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'INACTIVE';

/* =========================================================
 * HELPERS
 * ======================================================= */

function getUserName(
  user: AdminUserListItem
) {
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || 'ไม่ระบุชื่อ';
}

function getInitial(
  user: AdminUserListItem
) {
  const name = getUserName(user);

  return name
    .charAt(0)
    .toUpperCase() || 'U';
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'th-TH',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminUsersPage() {
  const router = useRouter();

  const [
    users,
    setUsers,
  ] =
    useState<AdminUserListItem[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    actionUserId,
    setActionUserId,
  ] = useState<string | null>(
    null
  );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState<RoleFilter>(
      'ALL'
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'ALL'
    );

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  /* =======================================================
   * LOAD
   * ===================================================== */

  const loadUsers =
    useCallback(
      async (
        isRefresh = false
      ) => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const current =
            await AuthService.getCurrentProfile();

          if (!current) {
            router.replace(
              '/login'
            );
            return;
          }

          if (
            current.role.toUpperCase() !==
            'ADMIN'
          ) {
            router.replace('/');
            return;
          }

          const data =
            await AdminUserService.getUsers();

          setUsers(data);
        } catch (err) {
          console.error(
            'LOAD ADMIN USERS ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูลสมาชิกได้'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [router]
    );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* =======================================================
   * STATS
   * ===================================================== */

  const stats =
    useMemo(() => {
      let owners = 0;
      let sitters = 0;
      let admins = 0;
      let active = 0;
      let inactive = 0;

      for (const user of users) {
        if (
          user.role === 'OWNER'
        ) {
          owners += 1;
        }

        if (
          user.role === 'SITTER'
        ) {
          sitters += 1;
        }

        if (
          user.role === 'ADMIN'
        ) {
          admins += 1;
        }

        if (user.isActive) {
          active += 1;
        } else {
          inactive += 1;
        }
      }

      return {
        total:
          users.length,
        owners,
        sitters,
        admins,
        active,
        inactive,
      };
    }, [users]);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredUsers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          if (
            roleFilter !==
              'ALL' &&
            user.role !==
              roleFilter
          ) {
            return false;
          }

          if (
            statusFilter ===
              'ACTIVE' &&
            !user.isActive
          ) {
            return false;
          }

          if (
            statusFilter ===
              'INACTIVE' &&
            user.isActive
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchText = [
            user.firstName,
            user.lastName,
            user.displayName,
            user.phone,
            user.role,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchText.includes(
            keyword
          );
        }
      );
    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);

  /* =======================================================
   * ACTIVE STATUS
   * ===================================================== */

  const handleToggleStatus =
    async (
      user: AdminUserListItem
    ) => {
      if (
        user.role === 'ADMIN'
      ) {
        setError(
          'ไม่สามารถเปลี่ยนสถานะบัญชี Admin จากหน้านี้ได้'
        );
        return;
      }

      const nextStatus =
        !user.isActive;

      const actionText =
        nextStatus
          ? 'เปิดใช้งาน'
          : 'ปิดใช้งาน';

      const confirmed =
        window.confirm(
          `ยืนยันการ${actionText}บัญชี "${getUserName(
            user
          )}" หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionUserId(
          user.id
        );
        setError('');
        setMessage('');

        await AdminUserService.setUserActiveStatus(
          user.id,
          nextStatus
        );

        setUsers(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                user.id
                  ? {
                      ...item,
                      isActive:
                        nextStatus,
                    }
                  : item
            )
        );

        setMessage(
          `${actionText}บัญชีเรียบร้อยแล้ว`
        );
      } catch (err) {
        console.error(
          'UPDATE USER STATUS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถเปลี่ยนสถานะบัญชีได้'
        );
      } finally {
        setActionUserId(
          null
        );
      }
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-600" />

            <p className="mt-3 text-sm text-slate-400">
              กำลังโหลดข้อมูลสมาชิก...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* BACK */}

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-purple-700"
        >
          <ChevronLeft className="h-4 w-4" />

          กลับหน้าหลัก Admin
        </Link>

        {/* HEADER */}

        <section className="mt-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-purple-600">
                  User Management
                </p>

                <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                  จัดการสมาชิก
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  ตรวจสอบและจัดการบัญชี
                  Owner, Sitter และ Admin
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadUsers(
                  true
                )
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              รีเฟรช
            </button>
          </div>
        </section>

        {/* MESSAGE */}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />

            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            {error}
          </div>
        )}

        {/* STATS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="สมาชิกทั้งหมด"
            value={stats.total}
            icon={
              <Users className="h-5 w-5" />
            }
          />

          <StatCard
            label="Owner"
            value={stats.owners}
            icon={
              <UserRound className="h-5 w-5" />
            }
          />

          <StatCard
            label="Sitter"
            value={stats.sitters}
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
          />

          <StatCard
            label="บัญชีใช้งาน"
            value={stats.active}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />
        </section>

        {/* SEARCH / FILTER */}

        <section className="mt-5 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="ค้นหาชื่อ เบอร์โทร หรือ Role..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              {/* ROLE */}

              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterButton
                  active={
                    roleFilter ===
                    'ALL'
                  }
                  onClick={() =>
                    setRoleFilter(
                      'ALL'
                    )
                  }
                >
                  ทั้งหมด
                </FilterButton>

                <FilterButton
                  active={
                    roleFilter ===
                    'OWNER'
                  }
                  onClick={() =>
                    setRoleFilter(
                      'OWNER'
                    )
                  }
                >
                  Owner
                </FilterButton>

                <FilterButton
                  active={
                    roleFilter ===
                    'SITTER'
                  }
                  onClick={() =>
                    setRoleFilter(
                      'SITTER'
                    )
                  }
                >
                  Sitter
                </FilterButton>

                <FilterButton
                  active={
                    roleFilter ===
                    'ADMIN'
                  }
                  onClick={() =>
                    setRoleFilter(
                      'ADMIN'
                    )
                  }
                >
                  Admin
                </FilterButton>
              </div>

              {/* STATUS */}

              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterButton
                  active={
                    statusFilter ===
                    'ALL'
                  }
                  onClick={() =>
                    setStatusFilter(
                      'ALL'
                    )
                  }
                >
                  ทุกสถานะ
                </FilterButton>

                <FilterButton
                  active={
                    statusFilter ===
                    'ACTIVE'
                  }
                  onClick={() =>
                    setStatusFilter(
                      'ACTIVE'
                    )
                  }
                >
                  Active
                </FilterButton>

                <FilterButton
                  active={
                    statusFilter ===
                    'INACTIVE'
                  }
                  onClick={() =>
                    setStatusFilter(
                      'INACTIVE'
                    )
                  }
                >
                  Inactive
                </FilterButton>
              </div>
            </div>
          </div>
        </section>

        {/* LIST */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-black text-purple-950 sm:text-base">
              รายชื่อสมาชิก
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {
                filteredUsers.length
              }{' '}
              รายการ
            </p>
          </div>

          {filteredUsers.length ===
          0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center p-6 text-center">
              <Users className="h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-600">
                ไม่พบสมาชิก
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-[#FAF8FE]">
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400">
                        สมาชิก
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        Role
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        เบอร์โทร
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        วันที่สมัคร
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        สถานะ
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400">
                        จัดการ
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map(
                      (user) => (
                        <UserRow
                          key={
                            user.id
                          }
                          user={user}
                          loading={
                            actionUserId ===
                            user.id
                          }
                          onToggle={
                            handleToggleStatus
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredUsers.map(
                  (user) => (
                    <UserMobileCard
                      key={
                        user.id
                      }
                      user={user}
                      loading={
                        actionUserId ===
                        user.id
                      }
                      onToggle={
                        handleToggleStatus
                      }
                    />
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
 * ROW
 * ======================================================= */

function UserRow({
  user,
  loading,
  onToggle,
}: {
  user: AdminUserListItem;
  loading: boolean;
  onToggle: (
    user: AdminUserListItem
  ) => void;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-purple-50/30">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
            {getInitial(
              user
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {getUserName(
                user
              )}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {user.id.slice(
                0,
                8
              )}
              ...
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <RoleBadge
          role={user.role}
        />
      </td>

      <td className="px-4 py-4 text-xs text-slate-500">
        {user.phone || '-'}
      </td>

      <td className="px-4 py-4 text-xs text-slate-500">
        {formatDate(
          user.createdAt
        )}
      </td>

      <td className="px-4 py-4">
        <ActiveBadge
          active={
            user.isActive
          }
        />
      </td>

      <td className="px-5 py-4 text-right">
        {user.role ===
        'ADMIN' ? (
          <span className="text-[10px] font-bold text-slate-400">
            ไม่สามารถแก้ไข
          </span>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              onToggle(user)
            }
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
              user.isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : user.isActive ? (
              <UserX className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}

            {user.isActive
              ? 'ปิดบัญชี'
              : 'เปิดบัญชี'}
          </button>
        )}
      </td>
    </tr>
  );
}

/* =========================================================
 * MOBILE
 * ======================================================= */

function UserMobileCard({
  user,
  loading,
  onToggle,
}: {
  user: AdminUserListItem;
  loading: boolean;
  onToggle: (
    user: AdminUserListItem
  ) => void;
}) {
  return (
    <article className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
          {getInitial(user)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">
            {getUserName(
              user
            )}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <RoleBadge
              role={user.role}
            />

            <ActiveBadge
              active={
                user.isActive
              }
            />
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            สมัคร{' '}
            {formatDate(
              user.createdAt
            )}
          </p>
        </div>
      </div>

      {user.role !==
        'ADMIN' && (
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onToggle(user)
          }
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50 ${
            user.isActive
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : user.isActive ? (
            <UserX className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}

          {user.isActive
            ? 'ปิดใช้งานบัญชี'
            : 'เปิดใช้งานบัญชี'}
        </button>
      )}
    </article>
  );
}

/* =========================================================
 * COMPONENTS
 * ======================================================= */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-black text-purple-950">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
        active
          ? 'bg-purple-600 text-white'
          : 'border border-slate-200 bg-white text-slate-500 hover:bg-purple-50 hover:text-purple-700'
      }`}
    >
      {children}
    </button>
  );
}

function RoleBadge({
  role,
}: {
  role: AdminUserRole;
}) {
  const className =
    role === 'ADMIN'
      ? 'bg-red-50 text-red-700'
      : role === 'SITTER'
        ? 'bg-purple-50 text-purple-700'
        : 'bg-blue-50 text-blue-700';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}
    >
      {role}
    </span>
  );
}

function ActiveBadge({
  active,
}: {
  active: boolean;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
      <UserX className="h-3 w-3" />
      Inactive
    </span>
  );
}