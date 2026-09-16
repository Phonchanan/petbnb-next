/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Home,
  ImagePlus,
  Loader2,
  PawPrint,
  Phone,
  PlayCircle,
  Send,
  ShieldCheck,
  Trash2,
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

import {
  CareUpdateService,
  type CareUpdate,
} from '@/lib/supabase/careUpdateService';

import {
  getPaymentByBookingId,
  type Payment,
} from '@/lib/supabase/paymentService';

/* =========================================================
 * TYPES
 * ======================================================= */

type ToastState =
  | {
      type:
        | 'success'
        | 'error';
      message: string;
    }
  | null;

/* =========================================================
 * PAGE
 * ======================================================= */

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

  /* =======================================================
   * BOOKING STATE
   * ===================================================== */

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
    payment,
    setPayment,
  ] =
    useState<Payment | null>(
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

  /* =======================================================
   * TOAST
   * ===================================================== */

  const [
    toast,
    setToast,
  ] =
    useState<ToastState>(
      null
    );

  /* =======================================================
   * REJECT
   * ===================================================== */

  const [
    rejectOpen,
    setRejectOpen,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState('');

  /* =======================================================
   * DAILY CARE UPDATE
   * ===================================================== */

  const [
    careUpdates,
    setCareUpdates,
  ] =
    useState<CareUpdate[]>(
      []
    );

  const [
    updateMessage,
    setUpdateMessage,
  ] = useState('');

  const [
    selectedImages,
    setSelectedImages,
  ] =
    useState<File[]>([]);

  const [
    updateLoading,
    setUpdateLoading,
  ] = useState(false);

  /* =======================================================
   * TOAST FUNCTION
   * ===================================================== */

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

  /* =======================================================
   * LOAD DATA
   * ===================================================== */

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
            router.replace(
              '/'
            );

            return;
          }

          /* ===============================================
           * SITTER PROFILE
           * ============================================= */

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

          /* ===============================================
           * BOOKING DETAIL
           * ============================================= */

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

          /* ===============================================
           * PAYMENT
           * ============================================= */

          try {
            const paymentData =
              await getPaymentByBookingId(
                detail.id
              );

            setPayment(
              paymentData
            );
          } catch (
            paymentError
          ) {
            console.error(
              'LOAD PAYMENT ERROR:',
              paymentError
            );

            setPayment(
              null
            );
          }

          /* ===============================================
           * CARE UPDATES
           * ============================================= */

          const updates =
            await CareUpdateService.getByBookingId(
              bookingId
            );

          setCareUpdates(
            updates
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
        router,
      ]
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
   * UPDATE BOOKING STATUS
   * ===================================================== */

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

  /* =======================================================
   * REJECT BOOKING
   * ===================================================== */

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

  /* =======================================================
   * SELECT CARE IMAGES
   * ===================================================== */

  const handleImageChange =
    (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const files =
        Array.from(
          event.target.files ??
            []
        );

      if (
        files.length ===
        0
      ) {
        return;
      }

      const invalidFile =
        files.find(
          (file) =>
            !file.type.startsWith(
              'image/'
            )
        );

      if (
        invalidFile
      ) {
        showToast(
          'error',
          'รองรับเฉพาะไฟล์รูปภาพ'
        );

        event.target.value =
          '';

        return;
      }

      const tooLarge =
        files.find(
          (file) =>
            file.size >
            5 *
              1024 *
              1024
        );

      if (
        tooLarge
      ) {
        showToast(
          'error',
          'รูปภาพแต่ละรูปต้องมีขนาดไม่เกิน 5 MB'
        );

        event.target.value =
          '';

        return;
      }

      if (
        selectedImages.length +
          files.length >
        4
      ) {
        showToast(
          'error',
          'สามารถเลือกรูปได้สูงสุด 4 รูปต่ออัปเดต'
        );
      }

      const combined = [
        ...selectedImages,
        ...files,
      ].slice(
        0,
        4
      );

      setSelectedImages(
        combined
      );

      event.target.value =
        '';
    };

  /* =======================================================
   * REMOVE SELECTED IMAGE
   * ===================================================== */

  const removeSelectedImage =
    (
      index: number
    ) => {
      setSelectedImages(
        (
          previous
        ) =>
          previous.filter(
            (
              _,
              currentIndex
            ) =>
              currentIndex !==
              index
          )
      );
    };

  /* =======================================================
   * CREATE CARE UPDATE
   * ===================================================== */

  const submitCareUpdate =
    async () => {
      if (
        !booking ||
        updateLoading
      ) {
        return;
      }

      if (
        booking.status !==
        'IN_PROGRESS'
      ) {
        showToast(
          'error',
          'สามารถส่งอัปเดตได้เฉพาะตอนที่กำลังให้บริการ'
        );

        return;
      }

      const cleanMessage =
        updateMessage.trim();

      if (!cleanMessage) {
        showToast(
          'error',
          'กรุณากรอกรายละเอียดการดูแล'
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
          'ไม่พบข้อมูลผู้รับฝาก'
        );

        return;
      }

      try {
        setUpdateLoading(
          true
        );

        await CareUpdateService.createUpdate(
          {
            bookingId:
              booking.id,

            sitterProfileId,

            message:
              cleanMessage,

            images:
              selectedImages,
          }
        );

        setUpdateMessage(
          ''
        );

        setSelectedImages(
          []
        );

        showToast(
          'success',
          'ส่งอัปเดตการดูแลเรียบร้อยแล้ว'
        );

        const updates =
          await CareUpdateService.getByBookingId(
            booking.id
          );

        setCareUpdates(
          updates
        );
      } catch (err) {
        console.error(
          'CREATE CARE UPDATE ERROR:',
          err
        );

        showToast(
          'error',
          err instanceof Error
            ? err.message
            : 'ไม่สามารถส่งอัปเดตได้'
        );
      } finally {
        setUpdateLoading(
          false
        );
      }
    };

  /* =======================================================
   * DELETE CARE UPDATE
   * ===================================================== */

  const deleteCareUpdate =
    async (
      updateId: string
    ) => {
      if (
        updateLoading
      ) {
        return;
      }

      if (
        booking?.status !==
        'IN_PROGRESS'
      ) {
        showToast(
          'error',
          'ไม่สามารถลบอัปเดตหลังจบการให้บริการได้'
        );

        return;
      }

      const confirmed =
        window.confirm(
          'ต้องการลบอัปเดตนี้ใช่หรือไม่?'
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setUpdateLoading(
          true
        );

        await CareUpdateService.deleteUpdate(
          updateId,
          sitterProfileId
        );

        setCareUpdates(
          (
            previous
          ) =>
            previous.filter(
              (item) =>
                item.id !==
                updateId
            )
        );

        showToast(
          'success',
          'ลบอัปเดตเรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'DELETE CARE UPDATE ERROR:',
          err
        );

        showToast(
          'error',
          err instanceof Error
            ? err.message
            : 'ไม่สามารถลบอัปเดตได้'
        );
      } finally {
        setUpdateLoading(
          false
        );
      }
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

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

  /* =======================================================
   * ERROR
   * ===================================================== */

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

  /* =======================================================
   * DATA
   * ===================================================== */

  const status =
    getStatusInfo(
      booking.status as BookingStatus
    );

  const pet =
    booking.pet;

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      {/* TOAST */}
      {toast && (
        <div className="fixed right-4 top-4 z-9999 w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-200'
                : 'border-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            )}

            <p className="flex-1 text-xs font-bold leading-5 text-slate-600">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* BACK + HEADER */}
        <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/sitter/bookings"
              className="inline-flex items-center gap-1.5 text-[10px] font-black text-purple-500 transition hover:text-purple-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              กลับรายการจอง
            </Link>

            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
              Booking Detail
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-purple-950 sm:text-3xl">
              รายละเอียดการจอง
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              {booking.bookingCode || 'คำขอจอง'}
            </p>
          </div>

          <span
            className={`w-fit rounded-2xl px-4 py-2.5 text-[10px] font-black ${status.className}`}
          >
            {status.label}
          </span>
        </section>

        {/* HERO SUMMARY */}
        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E7D6FF] to-[#DCC6FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-[9px] font-black text-purple-700">
                <PawPrint className="h-3 w-3" />
                PetBnB Booking
              </div>

              <h2 className="mt-4 text-xl font-black text-[#32105C] sm:text-2xl">
                {pet.name}
              </h2>

              <p className="mt-1 text-xs text-purple-900/60">
                {getCategoryLabel(pet.categoryId)}
                {pet.breed ? ` • ${pet.breed}` : ''}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <InfoPill
                  icon={<Clock3 className="h-3.5 w-3.5" />}
                  text={`${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`}
                />

                <InfoPill
                  icon={<Home className="h-3.5 w-3.5" />}
                  text={booking.service.serviceName}
                />
              </div>
            </div>

            <div className="rounded-[24px] bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
              <p className="text-[9px] font-bold text-slate-400">
                ยอดรวม
              </p>

              <p className="mt-1 text-2xl font-black text-purple-700">
                {formatMoney(booking.totalPrice)}
              </p>

              <p className="mt-1 text-[9px] text-slate-400">
                {calculateDays(
                  booking.startDate,
                  booking.endDate
                )}{' '}
                วัน
              </p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* LEFT CONTENT */}
          <div className="space-y-5">
            {/* OWNER + PET */}
            <section className="grid gap-5 md:grid-cols-2">
              <article className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                  Owner
                </p>

                <h2 className="mt-1 text-sm font-black text-purple-950">
                  เจ้าของสัตว์เลี้ยง
                </h2>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#F3ECFF]">
                    {booking.owner.avatarUrl ? (
                      <img
                        src={booking.owner.avatarUrl}
                        alt={booking.owner.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-5 w-5 text-purple-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-purple-950">
                      {booking.owner.displayName}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Phone className="h-3.5 w-3.5 text-purple-500" />
                      {booking.owner.phone ||
                        'ไม่ได้ระบุเบอร์ติดต่อ'}
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                  Pet
                </p>

                <h2 className="mt-1 text-sm font-black text-purple-950">
                  สัตว์เลี้ยง
                </h2>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#F3ECFF]">
                    {pet.photoUrl ? (
                      <img
                        src={pet.photoUrl}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <PawPrint className="h-5 w-5 text-purple-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-purple-950">
                      {pet.name}
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-purple-500">
                      {getCategoryLabel(
                        pet.categoryId
                      )}
                    </p>
                  </div>
                </div>
              </article>
            </section>

            {/* PET INFO */}
            <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="w-full shrink-0 md:w-52">
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] bg-[#F8F4FF]">
                    {pet.photoUrl ? (
                      <img
                        src={pet.photoUrl}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PawPrint className="h-12 w-12 text-purple-200" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                    Pet Information
                  </p>

                  <h2 className="mt-1 text-xl font-black text-purple-950">
                    {pet.name}
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <PetInfo
                      label="สายพันธุ์"
                      value={pet.breed || '-'}
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

            {/* FOOD */}
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

            {/* HEALTH */}
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

            {/* EXTRA CARE */}
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

            {/* OWNER NOTE */}
            {booking.ownerNote && (
              <section className="rounded-[28px] bg-[#FFF9F0] p-5 shadow-[0_8px_30px_rgba(76,29,149,0.04)]">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500">
                  Owner Note
                </p>

                <h2 className="mt-1 text-sm font-black text-purple-950">
                  หมายเหตุจากเจ้าของ
                </h2>

                <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                  {booking.ownerNote}
                </p>
              </section>
            )}

            {/* DAILY CARE UPDATE */}
            {(booking.status ===
              'IN_PROGRESS' ||
              booking.status ===
                'COMPLETED') && (
              <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                    <Camera className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                      Daily Care
                    </p>

                    <h2 className="mt-1 text-sm font-black text-purple-950">
                      อัปเดตการดูแล
                    </h2>

                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      แจ้งกิจกรรมและความเป็นอยู่ของสัตว์เลี้ยงให้เจ้าของทราบ
                    </p>
                  </div>
                </div>

                {booking.status ===
                  'IN_PROGRESS' && (
                  <div className="mt-5 rounded-[22px] bg-[#F8F4FF] p-4">
                    <label className="text-[10px] font-black text-purple-950">
                      อัปเดตวันนี้
                    </label>

                    <textarea
                      rows={4}
                      value={updateMessage}
                      onChange={(event) =>
                        setUpdateMessage(
                          event.target.value
                        )
                      }
                      placeholder="เช่น วันนี้น้องกินอาหารหมด เล่นปกติ และพักผ่อนเรียบร้อยค่ะ"
                      className="mt-2 w-full resize-none rounded-2xl border border-purple-100 bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />

                    {selectedImages.length >
                      0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {selectedImages.map(
                          (
                            file,
                            index
                          ) => (
                            <SelectedImagePreview
                              key={`${file.name}-${file.size}-${index}`}
                              file={file}
                              index={index}
                              onRemove={
                                removeSelectedImage
                              }
                            />
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <label
                          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black transition ${
                            selectedImages.length >=
                            4
                              ? 'cursor-not-allowed bg-slate-100 text-slate-300'
                              : 'cursor-pointer bg-white text-purple-700 shadow-sm hover:bg-purple-50'
                          }`}
                        >
                          <ImagePlus className="h-4 w-4" />
                          เพิ่มรูปภาพ

                          {selectedImages.length >
                            0 && (
                            <span>
                              (
                              {
                                selectedImages.length
                              }
                              /4)
                            </span>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={
                              selectedImages.length >=
                              4
                            }
                            onChange={
                              handleImageChange
                            }
                            className="hidden"
                          />
                        </label>

                        <p className="mt-1.5 text-[9px] text-slate-400">
                          สูงสุด 4 รูป รูปละไม่เกิน 5 MB
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          updateLoading ||
                          !updateMessage.trim()
                        }
                        onClick={() =>
                          void submitCareUpdate()
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-[10px] font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updateLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}

                        ส่งอัปเดต
                      </button>
                    </div>
                  </div>
                )}

                {booking.status ===
                  'COMPLETED' && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />

                    <div>
                      <p className="text-xs font-black text-emerald-700">
                        แจ้งเจ้าของว่าบริการเสร็จสิ้นแล้ว
                      </p>

                      <p className="mt-0.5 text-[10px] text-emerald-600">
                        รอเจ้าของยืนยันการรับสัตว์เลี้ยงกลับ
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black text-purple-950">
                      ประวัติการอัปเดต
                    </h3>

                    {careUpdates.length >
                      0 && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[9px] font-bold text-purple-600">
                        {careUpdates.length}{' '}
                        อัปเดต
                      </span>
                    )}
                  </div>

                  {careUpdates.length ===
                  0 ? (
                    <div className="mt-3 rounded-[22px] bg-[#F8F4FF] px-5 py-8 text-center">
                      <Camera className="mx-auto h-7 w-7 text-purple-200" />

                      <p className="mt-2 text-xs font-bold text-slate-400">
                        ยังไม่มีอัปเดตการดูแล
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {careUpdates.map(
                        (update) => (
                          <article
                            key={update.id}
                            className="rounded-[22px] bg-[#FAF7FE] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100">
                                    <PawPrint className="h-3.5 w-3.5 text-purple-600" />
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-black text-purple-700">
                                      อัปเดตการดูแล
                                    </p>

                                    <p className="mt-0.5 text-[9px] text-slate-400">
                                      {formatCareUpdateDate(
                                        update.createdAt
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {update.message}
                                </p>
                              </div>

                              {booking.status ===
                                'IN_PROGRESS' && (
                                <button
                                  type="button"
                                  disabled={
                                    updateLoading
                                  }
                                  onClick={() =>
                                    void deleteCareUpdate(
                                      update.id
                                    )
                                  }
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                                  title="ลบอัปเดต"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            {update.images.length >
                              0 && (
                              <div
                                className={`mt-4 grid gap-2 ${
                                  update.images.length ===
                                  1
                                    ? 'grid-cols-1'
                                    : 'grid-cols-2'
                                }`}
                              >
                                {update.images.map(
                                  (image) => (
                                    <a
                                      key={image.id}
                                      href={image.imageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`block overflow-hidden rounded-xl bg-white ${
                                        update.images.length ===
                                        1
                                          ? 'max-h-100'
                                          : 'aspect-square'
                                      }`}
                                    >
                                      <img
                                        src={image.imageUrl}
                                        alt="รูปอัปเดตการดูแล"
                                        className="h-full w-full object-cover transition duration-200 hover:scale-[1.02]"
                                      />
                                    </a>
                                  )
                                )}
                              </div>
                            )}
                          </article>
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SUMMARY */}
          <aside>
            <section className="sticky top-6 rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                Booking Summary
              </p>

              <h2 className="mt-1 text-base font-black text-purple-950">
                สรุปการจอง
              </h2>

              <div className="mt-5 space-y-4">
                <Summary
                  label="บริการ"
                  value={
                    booking.service
                      .serviceName
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

                <div className="rounded-[22px] bg-[#F8F4FF] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-[10px] font-bold text-slate-400">
                      ยอดรวม
                    </span>

                    <span className="text-xl font-black text-purple-700">
                      {formatMoney(
                        booking.totalPrice
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {booking.status ===
                'PENDING' && (
                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void updateStatus(
                        'CONFIRMED'
                      )
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 text-xs font-black text-white transition hover:bg-purple-700 disabled:opacity-50"
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
                    disabled={actionLoading}
                    onClick={() =>
                      setRejectOpen(true)
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    ปฏิเสธการจอง
                  </button>
                </div>
              )}

              {booking.status ===
                'CONFIRMED' && (
                <div className="mt-5 space-y-3">
                  <div
                    className={`rounded-[22px] p-4 ${
                      payment?.payment_status ===
                      'PAID'
                        ? 'bg-emerald-50'
                        : 'bg-amber-50'
                    }`}
                  >
                    <p className="text-[9px] font-bold text-slate-400">
                      สถานะการชำระเงิน
                    </p>

                    {payment?.payment_status ===
                    'PAID' ? (
                      <div className="mt-1 flex items-center gap-2 text-xs font-black text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        เจ้าของชำระเงินแล้ว
                      </div>
                    ) : (
                      <div className="mt-1 text-xs font-black text-amber-700">
                        รอเจ้าของชำระเงิน
                      </div>
                    )}

                    {payment?.payment_status ===
                      'PAID' &&
                      payment.paid_at && (
                        <p className="mt-2 text-[9px] text-emerald-600">
                          ชำระเมื่อ{' '}
                          {formatPaymentDateTime(
                            payment.paid_at
                          )}
                        </p>
                      )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      payment?.payment_status !==
                        'PAID'
                    }
                    onClick={() =>
                      void updateStatus(
                        'IN_PROGRESS'
                      )
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 text-xs font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}

                    {payment?.payment_status ===
                    'PAID'
                      ? 'เริ่มให้บริการ'
                      : 'รอการชำระเงิน'}
                  </button>
                </div>
              )}

              {booking.status ===
                'IN_PROGRESS' && (
                <div className="mt-5">
                  <div className="mb-3 rounded-[22px] bg-purple-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />

                      <p className="text-[10px] font-black text-purple-700">
                        กำลังให้บริการ
                      </p>
                    </div>

                    <p className="mt-1 text-[9px] leading-4 text-purple-500">
                      ส่งอัปเดตการดูแลให้เจ้าของได้ระหว่างการรับฝาก
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      updateLoading
                    }
                    onClick={() =>
                      void updateStatus(
                        'COMPLETED'
                      )
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    แจ้งเจ้าของว่าบริการเสร็จสิ้น
                  </button>
                </div>
              )}

              {booking.status ===
                'COMPLETED' && (
                <div
                  className={`mt-5 rounded-[22px] px-4 py-3 ${
                    payment?.escrow_status ===
                    'RELEASED'
                      ? 'bg-emerald-50'
                      : 'bg-amber-50'
                  }`}
                >
                  {payment?.escrow_status ===
                  'RELEASED' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                        <p className="text-xs font-black text-emerald-700">
                          การจองเสร็จสมบูรณ์
                        </p>
                      </div>

                      <div className="mt-3 rounded-xl bg-white/80 px-3 py-2">
                        <p className="text-[9px] font-bold text-slate-400">
                          รายได้สุทธิหลังหักค่าคอมมิชชัน 10%
                        </p>

                        <p className="mt-1 text-base font-black text-emerald-700">
                          {formatMoney(
                            Number(
                              payment.net_amount ??
                                0
                            )
                          )}
                        </p>
                      </div>

                      {payment.released_at && (
                        <p className="mt-2 text-[9px] text-emerald-600">
                          ปล่อยยอดเมื่อ{' '}
                          {formatPaymentDateTime(
                            payment.released_at
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-amber-500" />

                        <p className="text-xs font-black text-amber-700">
                          รอเจ้าของยืนยันการรับสัตว์เลี้ยงกลับ
                        </p>
                      </div>

                      <p className="mt-1 text-[9px] leading-4 text-amber-600">
                        ระบบจะแจ้งผลเมื่อเจ้าของยืนยันว่าได้รับสัตว์เลี้ยงกลับเรียบร้อยแล้ว
                      </p>
                    </>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* REJECT MODAL */}
      {rejectOpen && (
        <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-400">
              Reject Booking
            </p>

            <h2 className="mt-1 text-lg font-black text-purple-950">
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
                disabled={actionLoading}
                onClick={() => {
                  setRejectOpen(false);
                  setRejectionReason('');
                }}
                className="h-11 rounded-2xl bg-slate-100 text-xs font-bold text-slate-600"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void confirmReject()
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 text-xs font-black text-white disabled:opacity-50"
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

function InfoPill({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-2 text-[9px] font-black text-purple-900/70">
      {icon}
      {text}
    </span>
  );
}

/* =========================================================
 * SELECTED IMAGE PREVIEW
 * ======================================================= */

function SelectedImagePreview({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (
    index: number
  ) => void;
}) {
  const [
    previewUrl,
    setPreviewUrl,
  ] = useState('');

  useEffect(() => {
    const url =
      URL.createObjectURL(
        file
      );

    setPreviewUrl(
      url
    );

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [file]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-purple-100 bg-white">
      {previewUrl && (
        <img
          src={
            previewUrl
          }
          alt={`รูปที่ ${
            index + 1
          }`}
          className="h-full w-full object-cover"
        />
      )}

      <button
        type="button"
        onClick={() =>
          onRemove(
            index
          )
        }
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        title="เอารูปออก"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[8px] font-bold text-white">
        {index + 1}
      </div>
    </div>
  );
}

/* =========================================================
 * DETAIL SECTION
 * ======================================================= */

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
    <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
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

/* =========================================================
 * DETAIL ITEM
 * ======================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | null;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF7FE] p-4">
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

/* =========================================================
 * PET INFO
 * ======================================================= */

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

/* =========================================================
 * BOOLEAN INFO
 * ======================================================= */

function BooleanInfo({
  label,
  value,
  trueLabel,
  falseLabel,
}: {
  label: string;
  value:
    | boolean
    | null;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF7FE] p-4">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <ShieldCheck
          className={`h-4 w-4 ${
            value ===
            true
              ? 'text-emerald-500'
              : 'text-slate-300'
          }`}
        />

        <span className="text-xs font-bold text-slate-600">
          {value ===
          null
            ? 'ไม่ได้ระบุ'
            : value
              ? trueLabel
              : falseLabel}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
 * SUMMARY
 * ======================================================= */

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

/* =========================================================
 * FORMAT PAYMENT DATE TIME
 * ======================================================= */

function formatPaymentDateTime(
  value: string
) {
  const date =
    new Date(value);

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
      dateStyle:
        'medium',
      timeStyle:
        'short',
      timeZone:
        'Asia/Bangkok',
    }
  ).format(date);
}

/* =========================================================
 * UUID
 * ======================================================= */

function isValidUuid(
  value:
    | string
    | null
    | undefined
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
          'ปฏิเสธแล้ว',

        className:
          'bg-rose-100 text-rose-700',
      };

    case 'CANCELLED':
      return {
        label:
          'เจ้าของยกเลิก',

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
 * CATEGORY
 * ======================================================= */

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

/* =========================================================
 * GENDER
 * ======================================================= */

function getGenderLabel(
  gender:
    | string
    | null
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

/* =========================================================
 * AGE
 * ======================================================= */

function getAgeLabel(
  ageYears:
    | number
    | null,
  birthDate:
    | string
    | null
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

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return '-';
  }

  const today =
    new Date();

  let years =
    today.getFullYear() -
    birth.getFullYear();

  const monthDifference =
    today.getMonth() -
    birth.getMonth();

  if (
    monthDifference <
      0 ||
    (
      monthDifference ===
        0 &&
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

  const diff =
    end.getTime() -
    start.getTime();

  return Math.max(
    1,
    Math.floor(
      diff /
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
    return '-';
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

/* =========================================================
 * CARE UPDATE DATE
 * ======================================================= */

function formatCareUpdateDate(
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
    return '-';
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
 * ACTION MESSAGE
 * ======================================================= */

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
      return 'แจ้งเจ้าของว่าการให้บริการเสร็จสิ้นแล้ว';
  }
}
