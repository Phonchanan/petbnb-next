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
  ChevronRight,
  Clock3,
  Loader2,
  Search,
  UserRound,
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
         * HEADER
         * =============================================== */}

        <section className="rounded-3xl border border-purple-100 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
                <CalendarDays className="h-3.5 w-3.5" />

                Booking Management
              </div>

              <h1 className="mt-2 text-xl font-black text-[#2E1065] sm:text-2xl">
                รายการจอง
              </h1>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                ตรวจสอบคำขอและรายละเอียดสัตว์เลี้ยง
                ก่อนรับหรือปฏิเสธงาน
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
         * ERROR
         * =============================================== */}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />

            <p className="text-xs font-bold text-rose-700">
              {error}
            </p>
          </div>
        )}

        {/* =================================================
         * FILTERS
         * =============================================== */}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <FilterButton
            label={`ทั้งหมด ${bookings.length}`}
            active={
              filter ===
              'ALL'
            }
            onClick={() =>
              setFilter('ALL')
            }
          />

          <FilterButton
            label={`รอการตอบรับ ${pendingCount}`}
            active={
              filter ===
              'PENDING'
            }
            onClick={() =>
              setFilter(
                'PENDING'
              )
            }
          />

          <FilterButton
            label="ยืนยันแล้ว"
            active={
              filter ===
              'CONFIRMED'
            }
            onClick={() =>
              setFilter(
                'CONFIRMED'
              )
            }
          />

          <FilterButton
            label="กำลังดูแล"
            active={
              filter ===
              'IN_PROGRESS'
            }
            onClick={() =>
              setFilter(
                'IN_PROGRESS'
              )
            }
          />

          <FilterButton
            label="เสร็จสิ้น"
            active={
              filter ===
              'COMPLETED'
            }
            onClick={() =>
              setFilter(
                'COMPLETED'
              )
            }
          />

          <FilterButton
            label="ปฏิเสธ"
            active={
              filter ===
              'REJECTED'
            }
            onClick={() =>
              setFilter(
                'REJECTED'
              )
            }
          />

          <FilterButton
            label="ยกเลิก"
            active={
              filter ===
              'CANCELLED'
            }
            onClick={() =>
              setFilter(
                'CANCELLED'
              )
            }
          />
        </div>

        {/* =================================================
         * EMPTY
         * =============================================== */}

        {filteredBookings.length ===
        0 ? (
          <section className="mt-3 flex min-h-62.5 flex-col items-center justify-center rounded-3xl border border-dashed border-purple-200 bg-white px-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50">
              <Search className="h-5 w-5 text-purple-300" />
            </div>

            <h2 className="mt-3 text-sm font-black text-purple-950">
              ยังไม่มีรายการจอง
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              รายการที่ตรงกับสถานะนี้จะแสดงที่นี่
            </p>
          </section>
        ) : (
          /* ===============================================
           * LIST
           * ============================================= */

          <section className="mt-3 space-y-3">
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
                    key={
                      booking.id
                    }
                    className="overflow-hidden rounded-[22px] border border-purple-100 bg-white shadow-sm transition hover:border-purple-200 hover:shadow-md"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        {/* =================================
                         * OWNER
                         * =============================== */}

                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-purple-100 bg-purple-50">
                            {owner?.avatarUrl ? (
                              <img
                                src={
                                  owner.avatarUrl
                                }
                                alt={
                                  owner.displayName
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <UserRound className="h-5 w-5 text-purple-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-sm font-black text-purple-950">
                                {owner?.displayName ||
                                  'เจ้าของสัตว์เลี้ยง'}
                              </h2>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${status.className}`}
                              >
                                {
                                  status.label
                                }
                              </span>
                            </div>

                            {booking.bookingCode && (
                              <p className="mt-1 text-[10px] text-slate-400">
                                {
                                  booking.bookingCode
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {/* =================================
                         * DATE
                         * =============================== */}

                        <div className="flex items-center gap-2 md:w-55">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                            <Clock3 className="h-4 w-4 text-purple-500" />
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400">
                              ช่วงเวลาฝาก
                            </p>

                            <p className="mt-0.5 text-[11px] font-bold text-slate-600">
                              {formatDate(
                                booking.startDate
                              )}{' '}
                              -{' '}
                              {formatDate(
                                booking.endDate
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] font-bold text-purple-500">
                              {days} วัน
                            </p>
                          </div>
                        </div>

                        {/* =================================
                         * PRICE
                         * =============================== */}

                        <div className="md:w-27.5 md:text-right">
                          <p className="text-[10px] text-slate-400">
                            ยอดรวม
                          </p>

                          <p className="mt-0.5 text-lg font-black text-purple-700">
                            {formatMoney(
                              booking.totalPrice
                            )}
                          </p>
                        </div>

                        {/* =================================
                         * DETAIL
                         * =============================== */}

                        <Link
                          href={`/sitter/bookings/${booking.id}`}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 text-[11px] font-black text-white transition hover:bg-purple-700"
                        >
                          ดูรายละเอียด

                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {/* =================================
                       * OWNER NOTE
                       * =============================== */}

                      {booking.ownerNote && (
                        <div className="mt-3 border-t border-purple-50 pt-3">
                          <p className="line-clamp-1 text-[11px] leading-5 text-slate-500">
                            <span className="font-bold text-purple-700">
                              หมายเหตุ:
                            </span>{' '}
                            {
                              booking.ownerNote
                            }
                          </p>
                        </div>
                      )}

                      {/* =================================
                       * REJECT
                       * =============================== */}

                      {booking.rejectionReason && (
                        <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2">
                          <p className="line-clamp-1 text-[11px] text-rose-700">
                            <span className="font-bold">
                              เหตุผลที่ปฏิเสธ:
                            </span>{' '}
                            {
                              booking.rejectionReason
                            }
                          </p>
                        </div>
                      )}
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
 * MINI SUMMARY
 * ======================================================= */

function MiniSummary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-purple-100 bg-[#FAF8FE] px-2 py-2.5 text-center">
      <p className="text-lg font-black leading-none text-purple-950">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-bold text-slate-400">
        {label}
      </p>
    </div>
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
      className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold transition ${
        active
          ? 'bg-purple-600 text-white shadow-sm'
          : 'border border-purple-100 bg-white text-purple-700 hover:bg-purple-50'
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