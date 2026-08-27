/* eslint-disable @typescript-eslint/no-unused-vars */
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
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminBookingListItem,
  AdminBookingService,
  AdminBookingStatus,
} from '@/lib/supabase/adminBookingService';

/* =========================================================
 * TYPES
 * ======================================================= */

type StatusFilter =
  | 'ALL'
  | AdminBookingStatus;

/* =========================================================
 * HELPERS
 * ======================================================= */

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

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    'th-TH',
    {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }
  ).format(value);
}

function getStatusLabel(
  status: AdminBookingStatus
) {
  switch (status) {
    case 'PENDING':
      return 'รอการตอบรับ';

    case 'CONFIRMED':
      return 'ยืนยันแล้ว';

    case 'IN_PROGRESS':
      return 'กำลังให้บริการ';

    case 'COMPLETED':
      return 'เสร็จสิ้น';

    case 'CANCELLED':
      return 'ยกเลิก';

    case 'REJECTED':
      return 'ปฏิเสธ';

    default:
      return status;
  }
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminBookingsPage() {
  const router = useRouter();

  const [
    bookings,
    setBookings,
  ] = useState<
    AdminBookingListItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'ALL'
    );

  /* =======================================================
   * LOAD
   * ===================================================== */

  const loadBookings =
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
            await AdminBookingService.getBookings();

          setBookings(data);
        } catch (err) {
          console.error(
            'LOAD ADMIN BOOKINGS ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดรายการจองได้'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [router]
    );

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  /* =======================================================
   * STATS
   * ===================================================== */

  const stats =
    useMemo(() => {
      const result = {
        total: bookings.length,
        pending: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
      };

      for (
        const booking of
        bookings
      ) {
        switch (
          booking.status
        ) {
          case 'PENDING':
            result.pending += 1;
            break;

          case 'CONFIRMED':
            result.confirmed += 1;
            break;

          case 'IN_PROGRESS':
            result.inProgress += 1;
            break;

          case 'COMPLETED':
            result.completed += 1;
            break;

          case 'CANCELLED':
            result.cancelled += 1;
            break;

          case 'REJECTED':
            result.rejected += 1;
            break;
        }
      }

      return result;
    }, [bookings]);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredBookings =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {
          if (
            statusFilter !==
              'ALL' &&
            booking.status !==
              statusFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchText = [
            booking.bookingCode,
            booking.ownerName,
            booking.sitterName,
            booking.petName,
            booking.serviceName,
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
      bookings,
      search,
      statusFilter,
    ]);

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
              กำลังโหลดรายการจอง...
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
                <CalendarDays className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-purple-600">
                  Booking Management
                </p>

                <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                  จัดการการจอง
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  ตรวจสอบรายการจองระหว่าง Owner
                  และ Sitter ทั้งระบบ
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadBookings(
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

        {/* ERROR */}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            {error}
          </div>
        )}

        {/* STATS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="การจองทั้งหมด"
            value={stats.total}
            icon={
              <CalendarDays className="h-5 w-5" />
            }
          />

          <StatCard
            label="รอการตอบรับ"
            value={stats.pending}
            icon={
              <Clock3 className="h-5 w-5" />
            }
          />

          <StatCard
            label="ยืนยันแล้ว"
            value={stats.confirmed}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <StatCard
            label="เสร็จสิ้น"
            value={stats.completed}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />
        </section>

        {/* SEARCH */}

        <section className="mt-5 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ค้นหารหัสการจอง, Owner, Sitter, สัตว์..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* FILTER */}

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
              ทั้งหมด
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                'PENDING'
              }
              onClick={() =>
                setStatusFilter(
                  'PENDING'
                )
              }
            >
              รอการตอบรับ
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                'CONFIRMED'
              }
              onClick={() =>
                setStatusFilter(
                  'CONFIRMED'
                )
              }
            >
              ยืนยันแล้ว
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                'IN_PROGRESS'
              }
              onClick={() =>
                setStatusFilter(
                  'IN_PROGRESS'
                )
              }
            >
              กำลังให้บริการ
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                'COMPLETED'
              }
              onClick={() =>
                setStatusFilter(
                  'COMPLETED'
                )
              }
            >
              เสร็จสิ้น
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                'CANCELLED'
              }
              onClick={() =>
                setStatusFilter(
                  'CANCELLED'
                )
              }
            >
              ยกเลิก
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                'REJECTED'
              }
              onClick={() =>
                setStatusFilter(
                  'REJECTED'
                )
              }
            >
              ปฏิเสธ
            </FilterButton>
          </div>
        </section>

        {/* LIST */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-black text-purple-950 sm:text-base">
              รายการจอง
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {
                filteredBookings.length
              }{' '}
              รายการ
            </p>
          </div>

          {filteredBookings.length ===
          0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center p-6 text-center">
              <CalendarDays className="h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-600">
                ไม่พบรายการจอง
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
                        Booking
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        Owner
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        Sitter
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        วันที่
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        ราคา
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">
                        สถานะ
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400">
                        รายละเอียด
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBookings.map(
                      (booking) => (
                        <BookingRow
                          key={
                            booking.id
                          }
                          booking={
                            booking
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredBookings.map(
                  (booking) => (
                    <BookingMobileCard
                      key={
                        booking.id
                      }
                      booking={
                        booking
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

function BookingRow({
  booking,
}: {
  booking: AdminBookingListItem;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-purple-50/30">
      <td className="px-5 py-4">
        <div>
          <p className="text-xs font-black text-purple-700">
            {booking.bookingCode ||
              booking.id.slice(
                0,
                8
              )}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-700">
            {booking.petName}
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            {booking.serviceName}
          </p>
        </div>
      </td>

      <td className="px-4 py-4 text-xs text-slate-600">
        {booking.ownerName}
      </td>

      <td className="px-4 py-4 text-xs text-slate-600">
        {booking.sitterName}
      </td>

      <td className="px-4 py-4 text-xs text-slate-500">
        <div>
          {formatDate(
            booking.startDate
          )}
        </div>

        <div className="mt-1 text-[10px] text-slate-400">
          ถึง{' '}
          {formatDate(
            booking.endDate
          )}
        </div>
      </td>

      <td className="px-4 py-4 text-xs font-bold text-slate-700">
        {formatCurrency(
          booking.totalPrice
        )}
      </td>

      <td className="px-4 py-4">
        <BookingStatusBadge
          status={
            booking.status
          }
        />
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800"
        >
          ดู
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

/* =========================================================
 * MOBILE
 * ======================================================= */

function BookingMobileCard({
  booking,
}: {
  booking: AdminBookingListItem;
}) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-purple-700">
            {booking.bookingCode ||
              booking.id.slice(
                0,
                8
              )}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {booking.petName}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {booking.serviceName}
          </p>
        </div>

        <BookingStatusBadge
          status={
            booking.status
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#FAF8FE] p-3">
        <InfoItem
          label="Owner"
          value={
            booking.ownerName
          }
        />

        <InfoItem
          label="Sitter"
          value={
            booking.sitterName
          }
        />

        <InfoItem
          label="เริ่ม"
          value={formatDate(
            booking.startDate
          )}
        />

        <InfoItem
          label="ราคา"
          value={formatCurrency(
            booking.totalPrice
          )}
        />
      </div>

      <Link
        href={`/admin/bookings/${booking.id}`}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700"
      >
        ดูรายละเอียด

        <ChevronRight className="h-4 w-4" />
      </Link>
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

function BookingStatusBadge({
  status,
}: {
  status: AdminBookingStatus;
}) {
  const className =
    status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'CONFIRMED'
        ? 'bg-blue-50 text-blue-700'
        : status === 'IN_PROGRESS'
          ? 'bg-purple-50 text-purple-700'
          : status === 'PENDING'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-red-50 text-red-700';

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}
    >
      {getStatusLabel(
        status
      )}
    </span>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}