/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  PawPrint,
  Search,
  UserRound,
  Wallet,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { AuthService } from '@/lib/auth';

import { supabase } from '@/lib/supabase/client';

import {
  SitterProfileService,
  type SitterProfileData,
} from '@/lib/supabase/sitterProfileService';

import {
  BookingService,
  type Booking,
  type BookingStatus,
} from '@/lib/supabase/bookingService';

/* =========================================================
 * TYPES
 * ======================================================= */

interface OwnerPreview {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function SitterBookingsPage() {
  const router = useRouter();

  const [
    sitterProfile,
    setSitterProfile,
  ] =
    useState<SitterProfileData | null>(
      null
    );

  const [
    bookings,
    setBookings,
  ] =
    useState<Booking[]>([]);

  const [
    owners,
    setOwners,
  ] =
    useState<
      Record<
        string,
        OwnerPreview
      >
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    filter,
    setFilter,
  ] =
    useState<
      'ALL' | BookingStatus
    >('ALL');

  /* =======================================================
   * LOAD DATA
   * ===================================================== */

  const loadData =
    async () => {
      try {
        setLoading(true);
        setError('');

        /* ===============================================
         * CURRENT USER
         * ============================================= */

        const current =
          await AuthService.getCurrentProfile();

        if (!current) {
          router.replace(
            '/login'
          );

          return;
        }

        if (
          current.role
            .trim()
            .toUpperCase() !==
          'SITTER'
        ) {
          router.replace('/');

          return;
        }

        /* ===============================================
         * SITTER PROFILE
         * ============================================= */

        const profile =
          await SitterProfileService.getByUserId(
            current.id
          );

        if (!profile) {
          setError(
            'กรุณาสร้างโปรไฟล์ผู้รับฝากก่อน'
          );

          return;
        }

        setSitterProfile(
          profile
        );

        /* ===============================================
         * BOOKINGS
         * ============================================= */

        const data =
          await BookingService.getBookingsBySitter(
            profile.id
          );

        setBookings(data);

        /* ===============================================
         * OWNER IDS
         * ============================================= */

        const ownerIds =
          Array.from(
            new Set(
              data
                .map(
                  (booking) =>
                    booking.ownerId
                )
                .filter(
                  (
                    value
                  ): value is string =>
                    typeof value ===
                      'string' &&
                    value.trim()
                      .length >
                      0
                )
            )
          );

        if (
          ownerIds.length ===
          0
        ) {
          setOwners({});

          return;
        }

        /* ===============================================
         * OWNER PROFILES
         * ============================================= */

        const {
          data: ownerData,
          error: ownerError,
        } =
          await supabase
            .from('profiles')
            .select(`
              id,
              display_name,
              first_name,
              last_name,
              avatar_url,
              phone
            `)
            .in(
              'id',
              ownerIds
            );

        if (ownerError) {
          console.error(
            'LOAD BOOKING OWNERS ERROR:',
            ownerError
          );

          setOwners({});

          return;
        }

        /* ===============================================
         * MAP OWNERS
         * ============================================= */

        const ownerMap: Record<
          string,
          OwnerPreview
        > = {};

        for (
          const owner of
          ownerData ?? []
        ) {
          const fullName =
            [
              owner.first_name,
              owner.last_name,
            ]
              .filter(Boolean)
              .join(' ')
              .trim();

          ownerMap[
            owner.id
          ] = {
            id:
              owner.id,

            displayName:
              owner.display_name?.trim() ||
              fullName ||
              'เจ้าของสัตว์เลี้ยง',

            avatarUrl:
              owner.avatar_url ??
              null,

            phone:
              owner.phone ??
              null,
          };
        }

        setOwners(
          ownerMap
        );
      } catch (err) {
        console.error(
          'LOAD SITTER BOOKINGS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดรายการจองได้'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void loadData();
  }, []);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredBookings =
    useMemo(() => {
      if (
        filter ===
        'ALL'
      ) {
        return bookings;
      }

      return bookings.filter(
        (booking) =>
          booking.status ===
          filter
      );
    }, [
      bookings,
      filter,
    ]);

  /* =======================================================
   * COUNTS
   * ===================================================== */

  const pendingCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'PENDING'
    ).length;

  const confirmedCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'CONFIRMED'
    ).length;

  const inProgressCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'IN_PROGRESS'
    ).length;

  const completedCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        'COMPLETED'
    ).length;

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="flex min-h-105 flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดรายการจอง...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
         * PAGE HEADER
         * =============================================== */}

        <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
              Booking Management
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-purple-950 sm:text-3xl">
              งานรับฝาก
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              จัดการคำขอจองและติดตามสถานะงานทั้งหมดของคุณ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-white px-4 py-2.5 text-[10px] font-black text-purple-700 shadow-sm ring-1 ring-purple-100">
              ทั้งหมด {bookings.length} งาน
            </div>
          </div>
        </section>

        {/* =================================================
         * HERO SUMMARY
         * =============================================== */}

        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E7D6FF] to-[#DCC6FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-[9px] font-black text-purple-700">
              <CalendarDays className="h-3 w-3" />
              Sitter Bookings
            </div>

            <h2 className="mt-4 text-xl font-black text-[#32105C] sm:text-2xl">
              ภาพรวมงานรับฝากของคุณ
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-purple-900/60">
              ดูคำขอใหม่ งานที่ยืนยันแล้ว งานที่กำลังดูแล และงานที่เสร็จสิ้นได้จากหน้านี้
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BookingSummaryCard
                label="คำขอใหม่"
                value={pendingCount}
                icon={<Clock3 className="h-4 w-4" />}
                tone="yellow"
              />

              <BookingSummaryCard
                label="ยืนยันแล้ว"
                value={confirmedCount}
                icon={<CalendarDays className="h-4 w-4" />}
                tone="purple"
              />

              <BookingSummaryCard
                label="กำลังดูแล"
                value={inProgressCount}
                icon={<PawPrint className="h-4 w-4" />}
                tone="green"
              />

              <BookingSummaryCard
                label="เสร็จสิ้น"
                value={completedCount}
                icon={<CheckCircle2 className="h-4 w-4" />}
                tone="pink"
              />
            </div>
          </div>
        </section>

        {/* =================================================
         * ERROR
         * =============================================== */}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />

            <p className="text-xs font-bold text-rose-700">
              {error}
            </p>
          </div>
        )}

        {/* =================================================
         * FILTERS
         * =============================================== */}

        <section className="mt-5 rounded-[24px] bg-white p-2 shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
          <div className="flex gap-2 overflow-x-auto">
            <FilterButton
              label={`ทั้งหมด ${bookings.length}`}
              active={filter === 'ALL'}
              onClick={() =>
                setFilter('ALL')
              }
            />

            <FilterButton
              label={`รอการตอบรับ ${pendingCount}`}
              active={filter === 'PENDING'}
              onClick={() =>
                setFilter('PENDING')
              }
            />

            <FilterButton
              label={`ยืนยันแล้ว ${confirmedCount}`}
              active={filter === 'CONFIRMED'}
              onClick={() =>
                setFilter('CONFIRMED')
              }
            />

            <FilterButton
              label={`กำลังดูแล ${inProgressCount}`}
              active={filter === 'IN_PROGRESS'}
              onClick={() =>
                setFilter('IN_PROGRESS')
              }
            />

            <FilterButton
              label={`เสร็จสิ้น ${completedCount}`}
              active={filter === 'COMPLETED'}
              onClick={() =>
                setFilter('COMPLETED')
              }
            />

            <FilterButton
              label="ปฏิเสธ"
              active={filter === 'REJECTED'}
              onClick={() =>
                setFilter('REJECTED')
              }
            />

            <FilterButton
              label="ยกเลิก"
              active={filter === 'CANCELLED'}
              onClick={() =>
                setFilter('CANCELLED')
              }
            />
          </div>
        </section>

        {/* =================================================
         * EMPTY
         * =============================================== */}

        {filteredBookings.length === 0 ? (
          <section className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-[28px] bg-white px-6 text-center shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
              <Search className="h-6 w-6 text-purple-300" />
            </div>

            <h2 className="mt-4 text-sm font-black text-purple-950">
              ยังไม่มีรายการจอง
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              รายการที่ตรงกับสถานะนี้จะแสดงที่นี่
            </p>
          </section>
        ) : (
          /* ===============================================
           * BOOKING GRID
           * ============================================= */

          <section className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredBookings.map(
              (booking) => {
                const owner =
                  owners[
                    booking.ownerId
                  ];

                const status =
                  getStatusInfo(
                    booking.status
                  );

                const days =
                  calculateDays(
                    booking.startDate,
                    booking.endDate
                  );

                return (
                  <article
                    key={booking.id}
                    className="group rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(76,29,149,0.09)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#F3ECFF]">
                          {owner?.avatarUrl ? (
                            <img
                              src={owner.avatarUrl}
                              alt={owner.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <UserRound className="h-5 w-5 text-purple-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-black text-purple-950">
                            {owner?.displayName ||
                              'เจ้าของสัตว์เลี้ยง'}
                          </h2>

                          <p className="mt-1 truncate text-[9px] text-slate-400">
                            {booking.bookingCode ||
                              'Booking'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#FAF7FE] p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-purple-500">
                            <Clock3 className="h-3.5 w-3.5" />
                          </div>

                          <div>
                            <p className="text-[8px] font-bold text-slate-400">
                              ช่วงเวลาฝาก
                            </p>

                            <p className="mt-0.5 text-[10px] font-black text-slate-600">
                              {formatDate(
                                booking.startDate
                              )}{' '}
                              -{' '}
                              {formatDate(
                                booking.endDate
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 text-[9px] font-black text-purple-500">
                          {days} วัน
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FAF7FE] p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-purple-500">
                            <Wallet className="h-3.5 w-3.5" />
                          </div>

                          <div>
                            <p className="text-[8px] font-bold text-slate-400">
                              ยอดรวม
                            </p>

                            <p className="mt-0.5 text-sm font-black text-purple-700">
                              {formatMoney(
                                booking.totalPrice
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {booking.ownerNote && (
                      <div className="mt-4 rounded-2xl bg-[#FFF9F0] px-3.5 py-3">
                        <p className="line-clamp-2 text-[10px] leading-5 text-slate-500">
                          <span className="font-black text-amber-700">
                            หมายเหตุ:
                          </span>{' '}
                          {booking.ownerNote}
                        </p>
                      </div>
                    )}

                    {booking.rejectionReason && (
                      <div className="mt-4 rounded-2xl bg-rose-50 px-3.5 py-3">
                        <p className="line-clamp-2 text-[10px] leading-5 text-rose-700">
                          <span className="font-black">
                            เหตุผลที่ปฏิเสธ:
                          </span>{' '}
                          {booking.rejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-purple-50 pt-4">
                      <span className="text-[9px] text-slate-400">
                        คลิกเพื่อดูรายละเอียดงาน
                      </span>

                      <Link
                        href={`/sitter/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2.5 text-[10px] font-black text-white transition hover:bg-purple-700"
                      >
                        ดูรายละเอียด

                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}
      </div>
    </main>
  );

}

/* =========================================================
 * BOOKING SUMMARY CARD
 * ======================================================= */

function BookingSummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone:
    | 'yellow'
    | 'purple'
    | 'green'
    | 'pink';
}) {
  const toneClasses = {
    yellow:
      'bg-[#FFF6D8] text-amber-700',
    purple:
      'bg-[#F1E8FF] text-purple-700',
    green:
      'bg-[#E8F8EF] text-emerald-700',
    pink:
      'bg-[#FFEAF2] text-rose-700',
  } as const;

  return (
    <article className="rounded-[22px] bg-white/80 p-4 shadow-sm backdrop-blur">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-[9px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-purple-950">
        {value}
      </p>
    </article>
  );
}

/* =========================================================
 * FILTER BUTTON
 * ======================================================= */

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`shrink-0 rounded-[14px] px-3.5 py-2 text-[10px] font-black transition ${
        active
          ? 'bg-purple-600 text-white shadow-[0_6px_16px_rgba(124,58,237,0.18)]'
          : 'bg-transparent text-slate-500 hover:bg-purple-50 hover:text-purple-700'
      }`}
    >
      {label}
    </button>
  );
}

/* =========================================================
 * STATUS
 * ======================================================= */

function getStatusInfo(
  status: BookingStatus
) {
  switch (status) {
    case 'PENDING':
      return {
        label:
          'รอการตอบรับ',

        className:
          'bg-amber-100 text-amber-700',
      };

    case 'CONFIRMED':
      return {
        label:
          'ยืนยันแล้ว',

        className:
          'bg-blue-100 text-blue-700',
      };

    case 'IN_PROGRESS':
      return {
        label:
          'กำลังดูแล',

        className:
          'bg-purple-100 text-purple-700',
      };

    case 'COMPLETED':
      return {
        label:
          'เสร็จสิ้น',

        className:
          'bg-emerald-100 text-emerald-700',
      };

    case 'REJECTED':
      return {
        label:
          'ปฏิเสธ',

        className:
          'bg-rose-100 text-rose-700',
      };

    case 'CANCELLED':
      return {
        label:
          'ยกเลิก',

        className:
          'bg-slate-100 text-slate-600',
      };

    default:
      return {
        label:
          status,

        className:
          'bg-slate-100 text-slate-600',
      };
  }
}

/* =========================================================
 * DAYS
 * ======================================================= */

function calculateDays(
  startDate: string,
  endDate: string
) {
  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return 0;
  }

  return Math.max(
    1,
    Math.floor(
      (
        end.getTime() -
        start.getTime()
      ) /
        86400000
    ) + 1
  );
}

/* =========================================================
 * DATE
 * ======================================================= */

function formatDate(
  value: string
) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'th-TH',
    {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    }
  ).format(date);
}

/* =========================================================
 * MONEY
 * ======================================================= */

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    'th-TH',
    {
      style:
        'currency',

      currency:
        'THB',

      minimumFractionDigits:
        0,

      maximumFractionDigits:
        0,
    }
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}