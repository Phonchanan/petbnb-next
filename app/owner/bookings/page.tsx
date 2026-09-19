
/* eslint-disable @next/next/no-location-assign-relative-destination */
/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  PawPrint,
  ReceiptText,
  XCircle,
} from 'lucide-react';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

import {
  BookingService,
  type Booking,
  type BookingStatus,
} from '@/lib/supabase/bookingService';

/* =========================================================
 * OWNER BOOKINGS PAGE
 * ======================================================= */

export default function OwnerBookingsPage() {
  const [
    profile,
    setProfile,
  ] =
    useState<CurrentProfile | null>(
      null
    );

  const [
    bookings,
    setBookings,
  ] =
    useState<Booking[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      'ALL' | BookingStatus
    >('ALL');

  /* =======================================================
   * LOAD BOOKINGS
   * ===================================================== */

  const loadBookings =
    async () => {
      try {
        setLoading(
          true
        );

        setError(
          ''
        );

        const current =
          await AuthService.getCurrentProfile();

        if (!current) {
          window.location.href =
            '/login';

          return;
        }

        if (
          !current.is_active
        ) {
          await AuthService.signOut();

          window.location.href =
            '/login';

          return;
        }

        if (
          current.role.toUpperCase() !==
          'OWNER'
        ) {
          if (
            current.role.toUpperCase() ===
            'SITTER'
          ) {
            window.location.href =
              '/sitter';
          } else {
            window.location.href =
              '/admin';
          }

          return;
        }

        setProfile(
          current
        );

        const data =
          await BookingService.getBookingsByOwner(
            current.id
          );

        setBookings(
          data
        );
      } catch (err) {
        console.error(
          'LOAD OWNER BOOKINGS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดรายการจองได้'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* =======================================================
   * INITIAL LOAD
   * ===================================================== */

  useEffect(() => {
    void loadBookings();
  }, []);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredBookings =
    useMemo(
      () => {
        if (
          statusFilter ===
          'ALL'
        ) {
          return bookings;
        }

        return bookings.filter(
          (booking) =>
            booking.status ===
            statusFilter
        );
      },
      [
        bookings,
        statusFilter,
      ]
    );

  /* =======================================================
   * CANCEL BOOKING
   * ===================================================== */

  const handleCancel =
    async (
      booking: Booking
    ) => {
      if (
        booking.status !==
        'PENDING'
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `ต้องการยกเลิกการจอง ${
            booking.bookingCode ||
            ''
          } ใช่หรือไม่?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setActionLoadingId(
          booking.id
        );

        setError(
          ''
        );

        setMessage(
          ''
        );

        await BookingService.cancelBooking(
          booking.id
        );

        setMessage(
          'ยกเลิกการจองเรียบร้อยแล้ว'
        );

        await loadBookings();
      } catch (err) {
        console.error(
          'CANCEL BOOKING ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถยกเลิกการจองได้'
        );
      } finally {
        setActionLoadingId(
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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs font-medium text-slate-400">
            กำลังโหลดรายการจอง...
          </p>
        </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  /* =======================================================
   * PAGE
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      {/* =================================================
       * HEADER
       * =============================================== */}

      <section className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/35 blur-2xl" />

        <div className="relative inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
          <CalendarDays className="h-3.5 w-3.5" />

          My Bookings
        </div>

        <h1 className="relative mt-3 text-2xl font-black tracking-tight text-[#2E1065] sm:text-3xl">
          การจองของฉัน
        </h1>

        <p className="relative mt-2 max-w-2xl text-sm font-medium leading-6 text-purple-950/60">
          ตรวจสอบสถานะ วันที่ ราคา
          และรายละเอียดการฝากสัตว์เลี้ยง
        </p>
      </section>

      {/* =================================================
       * SUCCESS MESSAGE
       * =============================================== */}

      {message && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />

          {message}
        </div>
      )}

      {/* =================================================
       * ERROR MESSAGE
       * =============================================== */}

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* =================================================
       * FILTER
       * =============================================== */}

      <section className="mb-5 flex gap-2 overflow-x-auto rounded-[22px] bg-white p-2 shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
        <FilterButton
          label="ทั้งหมด"
          active={
            statusFilter ===
            'ALL'
          }
          onClick={() =>
            setStatusFilter(
              'ALL'
            )
          }
        />

        <FilterButton
          label="รอดำเนินการ"
          active={
            statusFilter ===
            'PENDING'
          }
          onClick={() =>
            setStatusFilter(
              'PENDING'
            )
          }
        />

        <FilterButton
          label="ยืนยันแล้ว"
          active={
            statusFilter ===
            'CONFIRMED'
          }
          onClick={() =>
            setStatusFilter(
              'CONFIRMED'
            )
          }
        />

        <FilterButton
          label="กำลังให้บริการ"
          active={
            statusFilter ===
            'IN_PROGRESS'
          }
          onClick={() =>
            setStatusFilter(
              'IN_PROGRESS'
            )
          }
        />

        <FilterButton
          label="เสร็จสิ้น"
          active={
            statusFilter ===
            'COMPLETED'
          }
          onClick={() =>
            setStatusFilter(
              'COMPLETED'
            )
          }
        />

        <FilterButton
          label="ถูกปฏิเสธ"
          active={
            statusFilter ===
            'REJECTED'
          }
          onClick={() =>
            setStatusFilter(
              'REJECTED'
            )
          }
        />

        <FilterButton
          label="ยกเลิก"
          active={
            statusFilter ===
            'CANCELLED'
          }
          onClick={() =>
            setStatusFilter(
              'CANCELLED'
            )
          }
        />
      </section>

      {/* =================================================
       * EMPTY
       * =============================================== */}

      {filteredBookings.length ===
      0 ? (
        <section className="rounded-[28px] bg-white p-12 text-center shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-purple-600">
            <CalendarDays className="h-8 w-8" />
          </div>

          <h2 className="mt-4 font-bold text-purple-950">
            ยังไม่มีรายการจอง
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            รายการจองของคุณจะปรากฏที่นี่
          </p>
        </section>
      ) : (
        /* =================================================
         * BOOKING LIST
         * =============================================== */

        <section className="space-y-5">
          {filteredBookings.map(
            (booking) => {
              const statusInfo =
                getStatusInfo(
                  booking.status
                );

              const canCancel =
                booking.status ===
                'PENDING';

              return (
                <article
                  key={
                    booking.id
                  }
                  className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(76,29,149,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(76,29,149,0.09)]"
                >
                  {/* =========================================
                   * BOOKING BODY
                   * ======================================= */}

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* LEFT */}

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black text-purple-950">
                            {booking.bookingCode ||
                              'Booking'}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusInfo.className}`}
                          >
                            {
                              statusInfo.label
                            }
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          สร้างเมื่อ{' '}
                          {formatDateTime(
                            booking.createdAt
                          )}
                        </p>
                      </div>

                      {/* PRICE */}

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-bold text-slate-400">
                          ยอดรวม
                        </div>

                        <div className="text-xl font-black text-purple-700">
                          ฿
                          {formatMoney(
                            booking.totalPrice
                          )}
                        </div>
                      </div>
                    </div>

                    {/* =====================================
                     * BOOKING INFORMATION
                     * =================================== */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoCard
                        icon={
                          <CalendarDays className="h-4 w-4" />
                        }
                        label="วันที่ฝาก"
                        value={`${formatDate(
                          booking.startDate
                        )} - ${formatDate(
                          booking.endDate
                        )}`}
                      />

                      <InfoCard
                        icon={
                          <PawPrint className="h-4 w-4" />
                        }
                        label="จำนวนสัตว์"
                        value={`${
                          booking.petCount ??
                          1
                        } ตัว`}
                      />

                      <InfoCard
                        icon={
                          <ReceiptText className="h-4 w-4" />
                        }
                        label="ราคาต่อวัน"
                        value={
                          booking.dailyRate !==
                          null
                            ? `฿${formatMoney(
                                booking.dailyRate
                              )}`
                            : '-'
                        }
                      />

                      <InfoCard
                        icon={
                          <Clock3 className="h-4 w-4" />
                        }
                        label="สถานะ"
                        value={
                          statusInfo.label
                        }
                      />
                    </div>

                    {/* =====================================
                     * NOTES
                     * =================================== */}

                    {(
                      booking.ownerNote ||
                      booking.sitterNote ||
                      booking.rejectionReason
                    ) && (
                      <div className="mt-5 space-y-3 rounded-2xl bg-[#FAF7FE] p-4 text-xs">
                        {booking.ownerNote && (
                          <DetailRow
                            label="หมายเหตุของฉัน"
                            value={
                              booking.ownerNote
                            }
                          />
                        )}

                        {booking.sitterNote && (
                          <DetailRow
                            label="หมายเหตุจากผู้รับฝาก"
                            value={
                              booking.sitterNote
                            }
                          />
                        )}

                        {booking.rejectionReason && (
                          <DetailRow
                            label="เหตุผลที่ปฏิเสธ"
                            value={
                              booking.rejectionReason
                            }
                            danger
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* =========================================
                   * FOOTER
                   * ======================================= */}

                  <div className="flex flex-col gap-3 border-t border-purple-100/70 bg-[#FBF9FE] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-[10px] text-slate-400">
                      <span className="font-bold">
                        Booking ID:{' '}
                      </span>

                      <span className="break-all">
                        {
                          booking.id
                        }
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {/* =====================================
                       * DETAIL BUTTON
                       * =================================== */}

                      <Link
                        href={`/owner/bookings/${booking.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.20)] transition hover:bg-purple-700"
                      >
                        <ReceiptText className="h-3.5 w-3.5" />

                        ดูรายละเอียด
                      </Link>

                      {/* =====================================
                       * CANCEL BUTTON
                       * =================================== */}

                      {canCancel && (
                        <button
                          type="button"
                          disabled={
                            actionLoadingId ===
                            booking.id
                          }
                          onClick={() =>
                            void handleCancel(
                              booking
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoadingId ===
                          booking.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}

                          ยกเลิกการจอง
                        </button>
                      )}
                    </div>
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
      className={`shrink-0 rounded-[15px] px-4 py-2 text-[11px] font-black transition ${
        active
          ? 'bg-[#7C3AED] text-white shadow-[0_7px_16px_rgba(124,58,237,0.18)]'
          : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'
      }`}
    >
      {label}
    </button>
  );
}

/* =========================================================
 * INFO CARD
 * ======================================================= */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-[#F8F4FF] p-3.5">
      <div className="flex items-center gap-2 text-purple-600">
        {icon}

        <span className="text-[10px] font-bold text-slate-400">
          {label}
        </span>
      </div>

      <div className="mt-2 text-xs font-bold text-purple-950">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
 * DETAIL ROW
 * ======================================================= */

function DetailRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <span
        className={`shrink-0 font-bold ${
          danger
            ? 'text-rose-700'
            : 'text-purple-950'
        }`}
      >
        {label}:
      </span>

      <span
        className={
          danger
            ? 'text-rose-600'
            : 'text-slate-600'
        }
      >
        {value}
      </span>
    </div>
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
          'รอดำเนินการ',

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
          'กำลังให้บริการ',

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
          'ถูกปฏิเสธ',

        className:
          'bg-rose-100 text-rose-700',
      };

    case 'CANCELLED':
      return {
        label:
          'ยกเลิกแล้ว',

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
 * MONEY
 * ======================================================= */

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    'th-TH',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number.isFinite(
      value
    )
      ? value
      : 0
  );
}

/* =========================================================
 * DATE
 * ======================================================= */

function formatDate(
  value: string
) {
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
      day:
        'numeric',

      month:
        'short',

      year:
        'numeric',
    }
  ).format(
    date
  );
}

/* =========================================================
 * DATE TIME
 * ======================================================= */

function formatDateTime(
  value: string
) {
  const date =
    new Date(
      value
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
      day:
        'numeric',

      month:
        'short',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    }
  ).format(
    date
  );
}
