/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Home,
  Loader2,
  PawPrint,
  Phone,
  PlayCircle,
  ShieldCheck,
  UserRound,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import {
  AuthService,
} from '@/lib/auth';

import {
  SitterProfileService,
} from '@/lib/supabase/sitterProfileService';

import {
  BookingService,
  type BookingStatus,
} from '@/lib/supabase/bookingService';

import {
  SitterBookingDetailService,
  type SitterBookingDetail,
} from '@/lib/supabase/sitterBookingDetailService';

type ToastState =
  | {
      type:
        | 'success'
        | 'error';
      message: string;
    }
  | null;

export default function SitterBookingDetailPage() {
  const params =
    useParams<{
      bookingId: string;
    }>();

  const router =
    useRouter();

  const bookingId =
    typeof params?.bookingId ===
    'string'
      ? decodeURIComponent(
          params.bookingId
        ).trim()
      : '';

  const [
    sitterProfileId,
    setSitterProfileId,
  ] = useState('');

  const [
    booking,
    setBooking,
  ] =
    useState<SitterBookingDetail | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  const [
    toast,
    setToast,
  ] =
    useState<ToastState>(
      null
    );

  const [
    rejectOpen,
    setRejectOpen,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState('');

  const showToast =
    useCallback(
      (
        type:
          | 'success'
          | 'error',
        message: string
      ) => {
        setToast({
          type,
          message,
        });

        window.setTimeout(
          () => {
            setToast(
              null
            );
          },
          4500
        );
      },
      []
    );

  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setLoadError(
            ''
          );

          console.log(
            'BOOKING PARAM DEBUG:',
            {
              params,
              bookingId,
            }
          );

          if (
            !isValidUuid(
              bookingId
            )
          ) {
            throw new Error(
              `Booking ID ไม่ถูกต้อง: ${
                bookingId ||
                '(ค่าว่าง)'
              }`
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
            current.role
              .trim()
              .toUpperCase() !==
            'SITTER'
          ) {
            router.replace(
              '/'
            );

            return;
          }

          const sitterProfile =
            await SitterProfileService.getByUserId(
              current.id
            );

          if (
            !sitterProfile
          ) {
            throw new Error(
              'ไม่พบโปรไฟล์ผู้รับฝาก'
            );
          }

          const cleanSitterProfileId =
            sitterProfile.id?.trim();

          if (
            !isValidUuid(
              cleanSitterProfileId
            )
          ) {
            throw new Error(
              'Sitter Profile ID ไม่ถูกต้อง'
            );
          }

          setSitterProfileId(
            cleanSitterProfileId
          );

          const detail =
            await SitterBookingDetailService.getById(
              bookingId,
              cleanSitterProfileId
            );

          if (!detail) {
            throw new Error(
              'ไม่พบการจอง หรือคุณไม่มีสิทธิ์ดูการจองนี้'
            );
          }

          setBooking(
            detail
          );
        } catch (err) {
          console.error(
            'LOAD BOOKING DETAIL ERROR:',
            err
          );

          setLoadError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดรายละเอียดการจองได้'
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        bookingId,
        params,
        router,
      ]
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateStatus =
    async (
      status:
        | 'CONFIRMED'
        | 'REJECTED'
        | 'IN_PROGRESS'
        | 'COMPLETED',
      reason?: string
    ) => {
      if (
        !booking ||
        actionLoading
      ) {
        return;
      }

      if (
        !isValidUuid(
          booking.id
        )
      ) {
        showToast(
          'error',
          'รหัสการจองไม่ถูกต้อง'
        );

        return;
      }

      if (
        !isValidUuid(
          sitterProfileId
        )
      ) {
        showToast(
          'error',
          'รหัสโปรไฟล์ผู้รับฝากไม่ถูกต้อง'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        await BookingService.updateBookingStatus({
          bookingId:
            booking.id,

          sitterProfileId,

          status,

          rejectionReason:
            reason,
        });

        setRejectOpen(
          false
        );

        setRejectionReason(
          ''
        );

        showToast(
          'success',
          getActionSuccessMessage(
            status
          )
        );

        await loadData();
      } catch (err) {
        showToast(
          'error',
          err instanceof Error
            ? err.message
            : 'ไม่สามารถอัปเดตสถานะได้'
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const confirmReject =
    async () => {
      const reason =
        rejectionReason.trim();

      if (!reason) {
        showToast(
          'error',
          'กรุณาระบุเหตุผลที่ปฏิเสธ'
        );

        return;
      }

      await updateStatus(
        'REJECTED',
        reason
      );
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="flex min-h-125 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-sm text-slate-400">
            กำลังโหลดรายละเอียดการจอง...
          </p>
        </div>
      </main>
    );
  }

  if (
    loadError ||
    !booking
  ) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href="/sitter/bookings"
            className="inline-flex items-center gap-2 text-sm font-bold text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับรายการจอง
          </Link>

          <div className="mt-5 rounded-[28px] border border-rose-100 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto h-9 w-9 text-rose-400" />

            <p className="mt-4 text-sm font-bold text-slate-600">
              {loadError ||
                'ไม่พบการจอง'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const status =
    getStatusInfo(
      booking.status as BookingStatus
    );

  const pet =
    booking.pet;

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      {toast && (
        <div className="fixed right-4 top-4 z-9999 w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${
              toast.type ===
              'success'
                ? 'border-emerald-200'
                : 'border-rose-200'
            }`}
          >
            {toast.type ===
            'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            )}

            <p className="flex-1 text-xs font-bold leading-5 text-slate-600">
              {
                toast.message
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setToast(
                  null
                )
              }
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <Link
          href="/sitter/bookings"
          className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับรายการจอง
        </Link>

        <section className="mt-5 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                <Clock3 className="h-3.5 w-3.5" />
                Booking Detail
              </div>

              <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
                รายละเอียดการจอง
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                {booking.bookingCode ||
                  'คำขอจอง'}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-purple-950">
                เจ้าของสัตว์เลี้ยง
              </h2>

              <div className="mt-4 flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-purple-100 bg-purple-50">
                  {booking.owner.avatarUrl ? (
                    <img
                      src={
                        booking.owner.avatarUrl
                      }
                      alt={
                        booking.owner.displayName
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserRound className="h-7 w-7 text-purple-400" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-black text-purple-950">
                    {
                      booking.owner.displayName
                    }
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="h-3.5 w-3.5 text-purple-500" />

                    {booking.owner.phone ||
                      'ไม่ได้ระบุเบอร์ติดต่อ'}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-purple-600" />

                <h2 className="text-sm font-black text-purple-950">
                  สัตว์เลี้ยงที่นำมาฝาก
                </h2>
              </div>

              <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
                <div className="w-full shrink-0 md:w-65">
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-purple-100 bg-purple-50">
                    {pet.photoUrl ? (
                      <img
                        src={
                          pet.photoUrl
                        }
                        alt={
                          pet.name
                        }
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <PawPrint className="h-14 w-14 text-purple-200" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-black text-purple-950">
                    {pet.name}
                  </h3>

                  <p className="mt-1 text-xs font-bold text-purple-600">
                    {getCategoryLabel(
                      pet.categoryId
                    )}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <PetInfo
                      label="สายพันธุ์"
                      value={
                        pet.breed || '-'
                      }
                    />

                    <PetInfo
                      label="เพศ"
                      value={getGenderLabel(
                        pet.gender
                      )}
                    />

                    <PetInfo
                      label="อายุ"
                      value={getAgeLabel(
                        pet.ageYears,
                        pet.birthDate
                      )}
                    />

                    <PetInfo
                      label="น้ำหนัก"
                      value={
                        pet.weight !== null
                          ? `${pet.weight} กก.`
                          : '-'
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            <DetailSection
              icon={
                <Utensils className="h-4 w-4" />
              }
              title="อาหารและการให้อาหาร"
            >
              <DetailItem
                label="ข้อมูลอาหาร"
                value={pet.foodInfo}
              />

              <DetailItem
                label="ตารางให้อาหาร"
                value={pet.feedingSchedule}
              />
            </DetailSection>

            <DetailSection
              icon={
                <HeartPulse className="h-4 w-4" />
              }
              title="ข้อมูลสุขภาพ"
            >
              <DetailItem
                label="การแพ้"
                value={pet.allergies}
              />

              <DetailItem
                label="โรคประจำตัว"
                value={pet.medicalConditions}
              />

              <DetailItem
                label="ยา"
                value={pet.medication}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <BooleanInfo
                  label="การฉีดวัคซีน"
                  value={pet.isVaccinated}
                  trueLabel="ฉีดวัคซีนแล้ว"
                  falseLabel="ยังไม่ได้ฉีดวัคซีน"
                />

                <BooleanInfo
                  label="การทำหมัน"
                  value={pet.isSpayed}
                  trueLabel="ทำหมันแล้ว"
                  falseLabel="ยังไม่ได้ทำหมัน"
                />
              </div>
            </DetailSection>

            <DetailSection
              icon={
                <Home className="h-4 w-4" />
              }
              title="การดูแลเพิ่มเติม"
            >
              <DetailItem
                label="ความต้องการพิเศษ"
                value={pet.specialNeeds}
              />

              <DetailItem
                label="พฤติกรรม"
                value={pet.behaviorNotes}
              />

              <DetailItem
                label="ผู้ติดต่อฉุกเฉิน"
                value={pet.emergencyContact}
              />
            </DetailSection>

            {booking.ownerNote && (
              <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-black text-purple-950">
                  หมายเหตุจากเจ้าของ
                </h2>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {
                    booking.ownerNote
                  }
                </p>
              </section>
            )}
          </div>

          <aside>
            <section className="sticky top-24 rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
              <h2 className="font-black text-purple-950">
                สรุปการจอง
              </h2>

              <div className="mt-5 space-y-4">
                <Summary
                  label="บริการ"
                  value={
                    booking.service.serviceName
                  }
                />

                <Summary
                  label="วันที่เริ่มฝาก"
                  value={formatDate(
                    booking.startDate
                  )}
                />

                <Summary
                  label="วันที่รับกลับ"
                  value={formatDate(
                    booking.endDate
                  )}
                />

                <Summary
                  label="ระยะเวลา"
                  value={`${calculateDays(
                    booking.startDate,
                    booking.endDate
                  )} วัน`}
                />

                <Summary
                  label="ราคาต่อวัน"
                  value={formatMoney(
                    booking.dailyRate
                  )}
                />

                <div className="border-t border-purple-100 pt-4">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      ยอดรวม
                    </span>

                    <span className="text-2xl font-black text-purple-700">
                      {formatMoney(
                        booking.totalPrice
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {booking.status ===
                'PENDING' && (
                <div className="mt-6 grid gap-2">
                  <button
                    type="button"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      void updateStatus(
                        'CONFIRMED'
                      )
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-xs font-black text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    รับการจอง
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      setRejectOpen(true)
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    ปฏิเสธการจอง
                  </button>
                </div>
              )}

              {booking.status ===
                'CONFIRMED' && (
                <button
                  type="button"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    void updateStatus(
                      'IN_PROGRESS'
                    )
                  }
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-xs font-black text-white disabled:opacity-50"
                >
                  <PlayCircle className="h-4 w-4" />
                  เริ่มให้บริการ
                </button>
              )}

              {booking.status ===
                'IN_PROGRESS' && (
                <button
                  type="button"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    void updateStatus(
                      'COMPLETED'
                    )
                  }
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-black text-white disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  เสร็จสิ้นการให้บริการ
                </button>
              )}
            </section>
          </aside>
        </div>
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black text-purple-950">
              ปฏิเสธการจอง
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              กรุณาระบุเหตุผลเพื่อให้เจ้าของสัตว์เลี้ยงทราบ
            </p>

            <textarea
              rows={5}
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value
                )
              }
              placeholder="ระบุเหตุผลที่ปฏิเสธ..."
              className="mt-4 w-full resize-none rounded-2xl border border-purple-100 bg-[#FAF8FE] p-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() => {
                  setRejectOpen(false);
                  setRejectionReason('');
                }}
                className="h-11 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  void confirmReject()
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 text-xs font-black text-white disabled:opacity-50"
              >
                {actionLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-black text-purple-950">
        <span className="text-purple-600">
          {icon}
        </span>

        <h2 className="text-sm">
          {title}
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        {children}
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF8FE] p-4">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
        {value?.trim() ||
          'ไม่ได้ระบุ'}
      </p>
    </div>
  );
}

function PetInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF8FE] p-3">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-purple-950">
        {value}
      </p>
    </div>
  );
}

function BooleanInfo({
  label,
  value,
  trueLabel,
  falseLabel,
}: {
  label: string;
  value: boolean | null;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF8FE] p-4">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <ShieldCheck
          className={`h-4 w-4 ${
            value === true
              ? 'text-emerald-500'
              : 'text-slate-300'
          }`}
        />

        <span className="text-xs font-bold text-slate-600">
          {value === null
            ? 'ไม่ได้ระบุ'
            : value
              ? trueLabel
              : falseLabel}
        </span>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-xs font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}

function isValidUuid(
  value: string | null | undefined
) {
  if (!value) {
    return false;
  }

  const clean =
    value.trim();

  if (!clean) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    clean
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

function getCategoryLabel(
  categoryId: string
) {
  switch (categoryId) {
    case 'CANINE_FELINE':
      return 'สุนัขและแมว';

    case 'SMALL_MAMMALS':
      return 'สัตว์เลี้ยงลูกด้วยนมขนาดเล็ก';

    case 'REPTILES_AMPHIBIANS_AQUATICS':
      return 'สัตว์เลื้อยคลาน สัตว์สะเทินน้ำสะเทินบก และสัตว์น้ำ';

    case 'ORNAMENTAL_BIRDS_AVIANS':
      return 'นกและสัตว์ปีก';

    default:
      return categoryId;
  }
}

function getGenderLabel(
  gender: string | null
) {
  if (!gender) {
    return '-';
  }

  switch (
    gender.toUpperCase()
  ) {
    case 'MALE':
      return 'เพศผู้';

    case 'FEMALE':
      return 'เพศเมีย';

    default:
      return gender;
  }
}

function getAgeLabel(
  ageYears: number | null,
  birthDate: string | null
) {
  if (
    ageYears !== null &&
    ageYears >= 0
  ) {
    return `${ageYears} ปี`;
  }

  if (!birthDate) {
    return '-';
  }

  const birth =
    new Date(
      `${birthDate}T00:00:00`
    );

  const today =
    new Date();

  let years =
    today.getFullYear() -
    birth.getFullYear();

  const monthDifference =
    today.getMonth() -
    birth.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() <
        birth.getDate()
    )
  ) {
    years -= 1;
  }

  return years >= 0
    ? `${years} ปี`
    : '-';
}

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

  const diff =
    end.getTime() -
    start.getTime();

  return (
    Math.floor(
      diff / 86400000
    ) + 1
  );
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

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    'th-TH',
    {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}

function getActionSuccessMessage(
  status:
    | 'CONFIRMED'
    | 'REJECTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
) {
  switch (status) {
    case 'CONFIRMED':
      return 'รับการจองเรียบร้อยแล้ว';

    case 'REJECTED':
      return 'ปฏิเสธการจองเรียบร้อยแล้ว';

    case 'IN_PROGRESS':
      return 'เริ่มให้บริการเรียบร้อยแล้ว';

    case 'COMPLETED':
      return 'บันทึกการให้บริการเสร็จสิ้นแล้ว';
  }
}