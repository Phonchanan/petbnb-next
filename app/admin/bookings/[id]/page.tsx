/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  PawPrint,
  Phone,
  UserRound,
  XCircle,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminBookingDetail,
  AdminBookingService,
  AdminBookingStatus,
} from '@/lib/supabase/adminBookingService';

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
      month: 'long',
      year: 'numeric',
    }
  ).format(date);
}

function formatDateTime(
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
      dateStyle: 'medium',
      timeStyle: 'short',
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

function getBookingDuration(
  booking: AdminBookingDetail
) {
  const start =
    new Date(
      `${booking.startDate}T00:00:00`
    );

  const end =
    new Date(
      `${booking.endDate}T00:00:00`
    );

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return '-';
  }

  const milliseconds =
    end.getTime() -
    start.getTime();

  const days =
    Math.floor(
      milliseconds /
        (1000 *
          60 *
          60 *
          24)
    ) + 1;

  return `${Math.max(
    1,
    days
  )} วัน`;
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminBookingDetailPage() {
  const router = useRouter();
  const params = useParams();

  const bookingId =
    typeof params.id === 'string'
      ? params.id
      : '';

  const [
    booking,
    setBooking,
  ] =
    useState<AdminBookingDetail | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /* =======================================================
   * LOAD
   * ===================================================== */

  const loadBooking =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');

          if (!bookingId) {
            throw new Error(
              'ไม่พบรหัสการจอง'
            );
          }

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

          const detail =
            await AdminBookingService.getBookingById(
              bookingId
            );

          setBooking(detail);
        } catch (err) {
          console.error(
            'LOAD ADMIN BOOKING DETAIL ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดรายละเอียดการจองได้'
          );
        } finally {
          setLoading(false);
        }
      },
      [
        bookingId,
        router,
      ]
    );

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  /* =======================================================
   * ADD ONS
   * ===================================================== */

  const addOnsText =
    useMemo(() => {
      if (
        !booking?.addOns
      ) {
        return null;
      }

      try {
        return JSON.stringify(
          booking.addOns,
          null,
          2
        );
      } catch {
        return String(
          booking.addOns
        );
      }
    }, [booking]);

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
              กำลังโหลดรายละเอียดการจอง...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
   * NOT FOUND
   * ===================================================== */

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#FAF8FE] px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับรายการจอง
          </Link>

          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />

            <h1 className="mt-4 text-lg font-black text-slate-700">
              ไม่พบข้อมูลการจอง
            </h1>

            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </section>
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
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />

          กลับรายการจอง
        </Link>

        {/* HEADER */}

        <section className="mt-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-purple-600">
                Booking Detail
              </p>

              <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                {booking.bookingCode ||
                  `Booking ${booking.id.slice(
                    0,
                    8
                  )}`}
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                สร้างเมื่อ{' '}
                {formatDateTime(
                  booking.createdAt
                )}
              </p>
            </div>

            <BookingStatusBadge
              status={
                booking.status
              }
            />
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            {error}
          </div>
        )}

        {/* OVERVIEW */}

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            label="ระยะเวลาฝาก"
            value={getBookingDuration(
              booking
            )}
          />

          <SummaryCard
            icon={
              <PawPrint className="h-5 w-5" />
            }
            label="จำนวนสัตว์"
            value={`${booking.petCount ?? 1} ตัว`}
          />

          <SummaryCard
            icon={
              <CreditCard className="h-5 w-5" />
            }
            label="ราคารวม"
            value={formatCurrency(
              booking.totalPrice
            )}
          />

          <SummaryCard
            icon={
              <Clock3 className="h-5 w-5" />
            }
            label="สถานะ"
            value={getStatusLabel(
              booking.status
            )}
          />
        </section>

        {/* OWNER + SITTER */}

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <InfoSection
            title="ข้อมูล Owner"
            icon={
              <UserRound className="h-5 w-5" />
            }
          >
            <InfoRow
              label="ชื่อ"
              value={
                booking.ownerName
              }
            />

            <InfoRow
              label="เบอร์โทร"
              value={
                booking.ownerPhone ||
                '-'
              }
              icon={
                <Phone className="h-4 w-4" />
              }
            />

            <InfoRow
              label="หมายเหตุ"
              value={
                booking.ownerNote ||
                '-'
              }
            />
          </InfoSection>

          <InfoSection
            title="ข้อมูล Sitter"
            icon={
              <UserRound className="h-5 w-5" />
            }
          >
            <InfoRow
              label="ชื่อ"
              value={
                booking.sitterName
              }
            />

            <InfoRow
              label="หมายเหตุจาก Sitter"
              value={
                booking.sitterNote ||
                '-'
              }
            />

            {booking.rejectionReason && (
              <InfoRow
                label="เหตุผลที่ปฏิเสธ"
                value={
                  booking.rejectionReason
                }
              />
            )}
          </InfoSection>
        </section>

        {/* PET */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            title="ข้อมูลสัตว์เลี้ยง"
            icon={
              <PawPrint className="h-5 w-5" />
            }
          />

          <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
            <PetImage
              imageUrl={
                booking.petPhotoUrl
              }
              name={
                booking.petName
              }
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBox
                label="ชื่อสัตว์"
                value={
                  booking.petName
                }
              />

              <InfoBox
                label="ประเภท"
                value={
                  booking.petCategoryId ||
                  '-'
                }
              />

              <InfoBox
                label="สายพันธุ์"
                value={
                  booking.petBreed ||
                  '-'
                }
              />

              <InfoBox
                label="เพศ"
                value={
                  booking.petGender ||
                  '-'
                }
              />

              <InfoBox
                label="ข้อมูลอาหาร"
                value={
                  booking.petFoodInfo ||
                  '-'
                }
              />

              <InfoBox
                label="เวลาให้อาหาร"
                value={
                  booking.petFeedingSchedule ||
                  '-'
                }
              />

              <InfoBox
                label="อาการแพ้"
                value={
                  booking.petAllergies ||
                  '-'
                }
              />

              <InfoBox
                label="โรคประจำตัว"
                value={
                  booking.petMedicalConditions ||
                  '-'
                }
              />

              <InfoBox
                label="ยา"
                value={
                  booking.petMedication ||
                  '-'
                }
              />

              <InfoBox
                label="พฤติกรรม"
                value={
                  booking.petBehaviorNotes ||
                  '-'
                }
              />

              <InfoBox
                label="การดูแลพิเศษ"
                value={
                  booking.petSpecialNeeds ||
                  '-'
                }
              />
            </div>
          </div>
        </section>

        {/* SERVICE */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            title="รายละเอียดบริการ"
            icon={
              <CalendarDays className="h-5 w-5" />
            }
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoBox
              label="บริการ"
              value={
                booking.serviceName
              }
            />

            <InfoBox
              label="ประเภทบริการ"
              value={
                booking.serviceCategoryId ||
                '-'
              }
            />

            <InfoBox
              label="ราคาบริการ"
              value={`${formatCurrency(
                booking.servicePrice
              )} / ${
                booking.servicePriceUnit
              }`}
            />

            <InfoBox
              label="วันเริ่ม"
              value={formatDate(
                booking.startDate
              )}
            />

            <InfoBox
              label="วันสิ้นสุด"
              value={formatDate(
                booking.endDate
              )}
            />

            <InfoBox
              label="ราคาต่อวัน"
              value={
                booking.dailyRate !==
                null
                  ? formatCurrency(
                      booking.dailyRate
                    )
                  : '-'
              }
            />
          </div>
        </section>

        {/* TIMELINE */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            title="ประวัติสถานะ"
            icon={
              <Clock3 className="h-5 w-5" />
            }
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TimelineBox
              label="สร้างคำขอ"
              value={formatDateTime(
                booking.createdAt
              )}
              active
            />

            <TimelineBox
              label="ยืนยันการจอง"
              value={formatDateTime(
                booking.confirmedAt
              )}
              active={
                Boolean(
                  booking.confirmedAt
                )
              }
            />

            <TimelineBox
              label="เริ่มให้บริการ"
              value={formatDateTime(
                booking.startedAt
              )}
              active={
                Boolean(
                  booking.startedAt
                )
              }
            />

            <TimelineBox
              label="เสร็จสิ้น"
              value={formatDateTime(
                booking.completedAt
              )}
              active={
                Boolean(
                  booking.completedAt
                )
              }
            />
          </div>
        </section>

        {/* ADD ONS */}

        {addOnsText && (
          <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              title="บริการเสริม"
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
            />

            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-[#FAF8FE] p-4 text-xs leading-6 text-slate-600">
              {addOnsText}
            </pre>
          </section>
        )}

        {/* STATUS NOTE */}

        {(booking.status ===
          'CANCELLED' ||
          booking.status ===
            'REJECTED') && (
          <section className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="text-sm font-black text-red-800">
                  {booking.status ===
                  'REJECTED'
                    ? 'การจองถูกปฏิเสธ'
                    : 'การจองถูกยกเลิก'}
                </p>

                {booking.rejectionReason && (
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    {
                      booking.rejectionReason
                    }
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* =========================================================
 * COMPONENTS
 * ======================================================= */

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        {icon}
      </div>

      <h2 className="text-sm font-black text-purple-950 sm:text-base">
        {title}
      </h2>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-sm font-black text-purple-950">
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

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeading
        title={title}
        icon={icon}
      />

      <div className="mt-5 space-y-3">
        {children}
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-bold text-slate-400">
        {label}
      </span>

      <span className="inline-flex max-w-[65%] items-start gap-1.5 text-right text-sm font-semibold text-slate-700">
        {icon}
        {value}
      </span>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-[#FAF8FE] p-4">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function TimelineBox({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? 'border-emerald-100 bg-emerald-50'
          : 'border-slate-100 bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {active ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Clock3 className="h-4 w-4 text-slate-300" />
        )}

        <p
          className={`text-xs font-bold ${
            active
              ? 'text-emerald-700'
              : 'text-slate-400'
          }`}
        >
          {label}
        </p>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {value}
      </p>
    </div>
  );
}

function PetImage({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex min-h-47.5 items-center justify-center rounded-2xl bg-purple-50">
        <PawPrint className="h-10 w-10 text-purple-300" />
      </div>
    );
  }

  return (
    <div className="relative min-h-47.5 overflow-hidden rounded-2xl bg-slate-100">
      <Image
        src={imageUrl}
        alt={name}
        fill
        unoptimized
        className="object-cover"
      />
    </div>
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

  const icon =
    status === 'COMPLETED' ||
    status === 'CONFIRMED'
      ? (
          <CheckCircle2 className="h-4 w-4" />
        )
      : status === 'PENDING' ||
          status ===
            'IN_PROGRESS'
        ? (
            <Clock3 className="h-4 w-4" />
          )
        : (
            <XCircle className="h-4 w-4" />
          );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${className}`}
    >
      {icon}

      {getStatusLabel(
        status
      )}
    </span>
  );
}