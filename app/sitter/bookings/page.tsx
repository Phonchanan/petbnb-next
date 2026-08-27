/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  Clock3,
  Loader2,
  PlayCircle,
  XCircle,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import {
  AuthService,
} from '@/lib/auth';

import {
  SitterProfileService,
  type SitterProfileData,
} from '@/lib/supabase/sitterProfileService';

import {
  BookingService,
  type Booking,
  type BookingStatus,
} from '@/lib/supabase/bookingService';

export default function SitterBookingsPage() {
  const router = useRouter();

  const [sitterProfile, setSitterProfile] =
    useState<SitterProfileData | null>(null);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoadingId, setActionLoadingId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<'ALL' | BookingStatus>('ALL');

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const current =
        await AuthService.getCurrentProfile();

      if (!current) {
        router.replace('/login');
        return;
      }

      if (
        current.role.toUpperCase() !==
        'SITTER'
      ) {
        router.replace('/');
        return;
      }

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

      setSitterProfile(profile);

      const data =
        await BookingService.getBookingsBySitter(
          profile.id
        );

      setBookings(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถโหลดคำขอจองได้'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings =
    useMemo(() => {
      if (filter === 'ALL') {
        return bookings;
      }

      return bookings.filter(
        (booking) =>
          booking.status === filter
      );
    }, [bookings, filter]);

  const updateStatus = async (
    booking: Booking,
    status:
      | 'CONFIRMED'
      | 'REJECTED'
      | 'IN_PROGRESS'
      | 'COMPLETED'
  ) => {
    if (!sitterProfile) {
      return;
    }

    let rejectionReason:
      | string
      | undefined;

    if (status === 'REJECTED') {
      const reason =
        window.prompt(
          'กรุณาระบุเหตุผลที่ปฏิเสธ'
        );

      if (reason === null) {
        return;
      }

      if (!reason.trim()) {
        setError(
          'กรุณาระบุเหตุผลที่ปฏิเสธ'
        );
        return;
      }

      rejectionReason =
        reason.trim();
    }

    const labels = {
      CONFIRMED: 'ยืนยันคำขอ',
      REJECTED: 'ปฏิเสธคำขอ',
      IN_PROGRESS: 'เริ่มให้บริการ',
      COMPLETED: 'จบงาน',
    };

    const confirmed =
      window.confirm(
        `ต้องการ${labels[status]}ใช่หรือไม่?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        booking.id
      );

      setError('');
      setMessage('');

      await BookingService.updateBookingStatus({
        bookingId:
          booking.id,

        sitterProfileId:
          sitterProfile.id,

        status,

        rejectionReason,
      });

      setMessage(
        'อัปเดตสถานะการจองเรียบร้อยแล้ว'
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถอัปเดตสถานะได้'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex min-h-80 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
          <Clock3 className="h-3.5 w-3.5" />
          Booking Requests
        </div>

        <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
          คำขอจอง
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          ตรวจสอบและจัดการคำขอรับฝากสัตว์เลี้ยง
        </p>
      </section>

      {message && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <FilterButton
          label="ทั้งหมด"
          active={filter === 'ALL'}
          onClick={() =>
            setFilter('ALL')
          }
        />

        <FilterButton
          label="รอการตอบรับ"
          active={filter === 'PENDING'}
          onClick={() =>
            setFilter('PENDING')
          }
        />

        <FilterButton
          label="ยืนยันแล้ว"
          active={
            filter === 'CONFIRMED'
          }
          onClick={() =>
            setFilter('CONFIRMED')
          }
        />

        <FilterButton
          label="กำลังดูแล"
          active={
            filter === 'IN_PROGRESS'
          }
          onClick={() =>
            setFilter('IN_PROGRESS')
          }
        />

        <FilterButton
          label="เสร็จสิ้น"
          active={
            filter === 'COMPLETED'
          }
          onClick={() =>
            setFilter('COMPLETED')
          }
        />

        <FilterButton
          label="ปฏิเสธ"
          active={
            filter === 'REJECTED'
          }
          onClick={() =>
            setFilter('REJECTED')
          }
        />
      </div>

      {filteredBookings.length === 0 ? (
        <section className="mt-6 rounded-[30px] border border-dashed border-purple-200 bg-white p-12 text-center">
          <Clock3 className="mx-auto h-9 w-9 text-purple-300" />

          <h2 className="mt-4 font-bold text-purple-950">
            ยังไม่มีคำขอจอง
          </h2>
        </section>
      ) : (
        <section className="mt-6 space-y-5">
          {filteredBookings.map(
            (booking) => {
              const status =
                getStatusInfo(
                  booking.status
                );

              return (
                <article
                  key={booking.id}
                  className="overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-black text-purple-950">
                            {booking.bookingCode ||
                              'คำขอจอง'}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            booking.startDate
                          )}{' '}
                          -{' '}
                          {formatDate(
                            booking.endDate
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-slate-400">
                          ยอดรวม
                        </div>

                        <div className="text-xl font-black text-purple-700">
                          ฿
                          {booking.totalPrice.toLocaleString(
                            'th-TH'
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Info
                        label="Pet ID"
                        value={
                          booking.petId
                        }
                      />

                      <Info
                        label="Service ID"
                        value={
                          booking.serviceId
                        }
                      />

                      <Info
                        label="เบอร์ติดต่อ"
                        value={
                          booking.ownerPhone ||
                          '-'
                        }
                      />

                      <Info
                        label="จำนวนสัตว์"
                        value={`${
                          booking.petCount ??
                          1
                        } ตัว`}
                      />
                    </div>

                    {booking.ownerNote && (
                      <div className="mt-4 rounded-2xl bg-purple-50 p-4">
                        <div className="text-[10px] font-bold text-purple-700">
                          หมายเหตุจากเจ้าของ
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {
                            booking.ownerNote
                          }
                        </p>
                      </div>
                    )}

                    {booking.rejectionReason && (
                      <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-xs text-rose-700">
                        เหตุผลที่ปฏิเสธ:{' '}
                        {
                          booking.rejectionReason
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-purple-50 bg-[#FAF7FE]/60 p-4">
                    {booking.status ===
                      'PENDING' && (
                      <>
                        <button
                          type="button"
                          disabled={
                            actionLoadingId ===
                            booking.id
                          }
                          onClick={() =>
                            updateStatus(
                              booking,
                              'REJECTED'
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-white px-4 py-2.5 text-xs font-bold text-rose-600"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          ปฏิเสธ
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionLoadingId ===
                            booking.id
                          }
                          onClick={() =>
                            updateStatus(
                              booking,
                              'CONFIRMED'
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ยืนยันคำขอ
                        </button>
                      </>
                    )}

                    {booking.status ===
                      'CONFIRMED' && (
                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          booking.id
                        }
                        onClick={() =>
                          updateStatus(
                            booking,
                            'IN_PROGRESS'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        เริ่มให้บริการ
                      </button>
                    )}

                    {booking.status ===
                      'IN_PROGRESS' && (
                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          booking.id
                        }
                        onClick={() =>
                          updateStatus(
                            booking,
                            'COMPLETED'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        เสร็จสิ้น
                      </button>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </section>
      )}
    </main>
  );
}

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
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
        active
          ? 'bg-purple-600 text-white'
          : 'border border-purple-100 bg-white text-purple-700'
      }`}
    >
      {label}
    </button>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF7FE] p-3">
      <div className="text-[10px] font-bold text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-all text-xs font-bold text-purple-950">
        {value}
      </div>
    </div>
  );
}

function getStatusInfo(
  status: BookingStatus
) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'รอการตอบรับ',
        className:
          'bg-amber-100 text-amber-700',
      };

    case 'CONFIRMED':
      return {
        label: 'ยืนยันแล้ว',
        className:
          'bg-blue-100 text-blue-700',
      };

    case 'IN_PROGRESS':
      return {
        label: 'กำลังดูแล',
        className:
          'bg-purple-100 text-purple-700',
      };

    case 'COMPLETED':
      return {
        label: 'เสร็จสิ้น',
        className:
          'bg-emerald-100 text-emerald-700',
      };

    case 'REJECTED':
      return {
        label: 'ปฏิเสธแล้ว',
        className:
          'bg-rose-100 text-rose-700',
      };

    case 'CANCELLED':
      return {
        label: 'เจ้าของยกเลิก',
        className:
          'bg-slate-100 text-slate-600',
      };

    default:
      return {
        label: status,
        className:
          'bg-slate-100 text-slate-600',
      };
  }
}

function formatDate(
  value: string
) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  return new Intl.DateTimeFormat(
    'th-TH',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}