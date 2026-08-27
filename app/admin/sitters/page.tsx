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
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminSitterListItem,
  AdminSitterService,
} from '@/lib/supabase/adminSitterService';

/* =========================================================
 * TYPES
 * ======================================================= */

type FilterStatus =
  | 'ALL'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

/* =========================================================
 * HELPERS
 * ======================================================= */

function normalizeStatus(
  status: string | null | undefined
): Exclude<FilterStatus, 'ALL'> {
  const value = status?.toUpperCase() ?? '';

  if (value === 'APPROVED') {
    return 'APPROVED';
  }

  if (value === 'REJECTED') {
    return 'REJECTED';
  }

  return 'PENDING';
}

function getStatusLabel(
  status: string | null | undefined
) {
  switch (normalizeStatus(status)) {
    case 'APPROVED':
      return 'อนุมัติแล้ว';

    case 'REJECTED':
      return 'ไม่อนุมัติ';

    default:
      return 'รออนุมัติ';
  }
}

function getSitterName(
  sitter: AdminSitterListItem
) {
  if (sitter.displayName?.trim()) {
    return sitter.displayName.trim();
  }

  const fullName = [
    sitter.firstName,
    sitter.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || 'ไม่ระบุชื่อ';
}

function getInitials(
  sitter: AdminSitterListItem
) {
  const name = getSitterName(sitter);

  if (!name || name === 'ไม่ระบุชื่อ') {
    return 'S';
  }

  return name.charAt(0).toUpperCase();
}

function formatDate(
  dateString: string | null | undefined
) {
  if (!dateString) {
    return '-';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminSittersPage() {
  const router = useRouter();

  const [sitters, setSitters] = useState<
    AdminSitterListItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [filterStatus, setFilterStatus] =
    useState<FilterStatus>('ALL');

  /* =======================================================
   * LOAD DATA
   * ===================================================== */

  const loadSitters = useCallback(
    async (isRefresh = false) => {
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
          router.replace('/login');
          return;
        }

        if (
          current.role.toUpperCase() !== 'ADMIN'
        ) {
          router.replace('/');
          return;
        }

        const data =
          await AdminSitterService.getSitters();

        setSitters(data);
      } catch (err) {
        console.error(
          'LOAD ADMIN SITTERS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดรายชื่อผู้สมัครได้'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadSitters();
  }, [loadSitters]);

  /* =======================================================
   * STATS
   * ===================================================== */

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const sitter of sitters) {
      const status = normalizeStatus(
        sitter.verificationStatus
      );

      if (status === 'APPROVED') {
        approved += 1;
      } else if (status === 'REJECTED') {
        rejected += 1;
      } else {
        pending += 1;
      }
    }

    return {
      all: sitters.length,
      pending,
      approved,
      rejected,
    };
  }, [sitters]);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredSitters = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return sitters.filter((sitter) => {
      const status = normalizeStatus(
        sitter.verificationStatus
      );

      if (
        filterStatus !== 'ALL' &&
        status !== filterStatus
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchText = [
        sitter.displayName,
        sitter.firstName,
        sitter.lastName,
        getSitterName(sitter),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchText.includes(keyword);
    });
  }, [sitters, search, filterStatus]);

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-5">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-600" />

            <p className="mt-3 text-sm text-slate-500">
              กำลังโหลดรายชื่อผู้สมัคร...
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
        {/* ===============================================
            BACK
        ================================================ */}

        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-purple-700"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับหน้าหลัก Admin
        </Link>

        {/* ===============================================
            HEADER
        ================================================ */}

        <section className="rounded-3xl border border-purple-100 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-purple-600">
                  Admin Management
                </p>

                <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                  ตรวจสอบผู้สมัคร Sitter
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  ตรวจสอบข้อมูล เอกสาร
                  และสถานะของผู้สมัครเป็นผู้รับฝากสัตว์
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                void loadSitters(true)
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

        {/* ===============================================
            ERROR
        ================================================ */}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <div>
              <p className="font-bold">
                ไม่สามารถโหลดข้อมูลได้
              </p>

              <p className="mt-0.5 text-xs">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ===============================================
            STAT CARDS
        ================================================ */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="ผู้สมัครทั้งหมด"
            value={stats.all}
            icon={
              <Users className="h-5 w-5" />
            }
            iconClass="bg-purple-50 text-purple-600"
          />

          <StatCard
            title="รออนุมัติ"
            value={stats.pending}
            icon={
              <Clock3 className="h-5 w-5" />
            }
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="อนุมัติแล้ว"
            value={stats.approved}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="ไม่อนุมัติ"
            value={stats.rejected}
            icon={
              <XCircle className="h-5 w-5" />
            }
            iconClass="bg-red-50 text-red-600"
          />
        </section>

        {/* ===============================================
            SEARCH / FILTER
        ================================================ */}

        <section className="mt-5 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ค้นหาชื่อผู้สมัคร"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              <FilterButton
                active={
                  filterStatus === 'ALL'
                }
                onClick={() =>
                  setFilterStatus('ALL')
                }
              >
                ทั้งหมด {stats.all}
              </FilterButton>

              <FilterButton
                active={
                  filterStatus === 'PENDING'
                }
                onClick={() =>
                  setFilterStatus('PENDING')
                }
              >
                รออนุมัติ {stats.pending}
              </FilterButton>

              <FilterButton
                active={
                  filterStatus === 'APPROVED'
                }
                onClick={() =>
                  setFilterStatus('APPROVED')
                }
              >
                อนุมัติแล้ว {stats.approved}
              </FilterButton>

              <FilterButton
                active={
                  filterStatus === 'REJECTED'
                }
                onClick={() =>
                  setFilterStatus('REJECTED')
                }
              >
                ไม่อนุมัติ {stats.rejected}
              </FilterButton>
            </div>
          </div>
        </section>

        {/* ===============================================
            LIST
        ================================================ */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-purple-950 sm:text-base">
                รายชื่อผู้สมัคร
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {filteredSitters.length} รายการ
              </p>
            </div>

            <UserCheck className="h-5 w-5 text-purple-400" />
          </div>

          {filteredSitters.length === 0 ? (
            <EmptyState
              hasFilter={
                Boolean(search.trim()) ||
                filterStatus !== 'ALL'
              }
            />
          ) : (
            <>
              {/* =========================================
                  DESKTOP
              ========================================== */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full table-fixed">
                  <thead className="bg-[#FAF8FE]">
                    <tr className="border-b border-slate-100">
                      <th className="w-[30%] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        ผู้สมัคร
                      </th>

                      <th className="w-[18%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        เอกสาร
                      </th>

                      <th className="w-[24%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        วันที่สมัคร
                      </th>

                      <th className="w-[16%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        สถานะ
                      </th>

                      <th className="w-[12%] px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        จัดการ
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSitters.map(
                      (sitter) => (
                        <SitterRow
                          key={
                            sitter.sitterId
                          }
                          sitter={sitter}
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* =========================================
                  MOBILE
              ========================================== */}

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredSitters.map(
                  (sitter) => (
                    <MobileSitterCard
                      key={
                        sitter.sitterId
                      }
                      sitter={sitter}
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
 * STAT CARD
 * ======================================================= */

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 sm:text-xs">
            {title}
          </p>

          <p className="mt-1 text-2xl font-black text-purple-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * FILTER
 * ======================================================= */

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
      className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
        active
          ? 'bg-purple-600 text-white'
          : 'border border-slate-200 bg-white text-slate-500 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700'
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
 * TABLE ROW
 * ======================================================= */

function SitterRow({
  sitter,
}: {
  sitter: AdminSitterListItem;
}) {
  const hasDocuments =
    Boolean(sitter.identityDocumentUrl) &&
    Boolean(sitter.selfieUrl);

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-purple-50/30">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
            {getInitials(sitter)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">
              {getSitterName(sitter)}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400">
              ผู้สมัคร Sitter
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        {hasDocuments ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            ครบ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <AlertCircle className="h-4 w-4" />
            ไม่ครบ
          </span>
        )}
      </td>

      <td className="px-4 py-4 text-xs text-slate-500">
        {formatDate(sitter.createdAt)}
      </td>

      <td className="px-4 py-4">
        <StatusBadge
          status={
            sitter.verificationStatus
          }
        />
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/sitters/${sitter.sitterId}`}
          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-purple-600 transition hover:text-purple-800"
        >
          ตรวจสอบ
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

/* =========================================================
 * MOBILE
 * ======================================================= */

function MobileSitterCard({
  sitter,
}: {
  sitter: AdminSitterListItem;
}) {
  const hasDocuments =
    Boolean(sitter.identityDocumentUrl) &&
    Boolean(sitter.selfieUrl);

  return (
    <article className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
          {getInitials(sitter)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">
            {getSitterName(sitter)}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {formatDate(
              sitter.createdAt
            )}
          </p>
        </div>

        <StatusBadge
          status={
            sitter.verificationStatus
          }
        />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#FAF8FE] px-3 py-2.5">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            hasDocuments
              ? 'text-emerald-600'
              : 'text-amber-600'
          }`}
        >
          {hasDocuments ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}

          {hasDocuments
            ? 'เอกสารครบ'
            : 'เอกสารไม่ครบ'}
        </span>

        <Link
          href={`/admin/sitters/${sitter.sitterId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-600"
        >
          ตรวจสอบ
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

/* =========================================================
 * STATUS
 * ======================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeStatus(status);

  if (normalized === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        อนุมัติแล้ว
      </span>
    );
  }

  if (normalized === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
        <XCircle className="h-3 w-3" />
        ไม่อนุมัติ
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
      <Clock3 className="h-3 w-3" />
      {getStatusLabel(status)}
    </span>
  );
}

/* =========================================================
 * EMPTY
 * ======================================================= */

function EmptyState({
  hasFilter,
}: {
  hasFilter: boolean;
}) {
  return (
    <div className="flex min-h-57.5 flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
        {hasFilter ? (
          <Search className="h-5 w-5" />
        ) : (
          <UserCheck className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-700">
        {hasFilter
          ? 'ไม่พบผู้สมัครที่ค้นหา'
          : 'ยังไม่มีผู้สมัคร Sitter'}
      </h3>

      <p className="mt-1.5 text-xs text-slate-400">
        {hasFilter
          ? 'ลองเปลี่ยนคำค้นหาหรือสถานะ'
          : 'เมื่อมีผู้สมัคร รายการจะแสดงในหน้านี้'}
      </p>
    </div>
  );
}