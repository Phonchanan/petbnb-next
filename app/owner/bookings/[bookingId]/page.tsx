/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Loader2,
  MessageSquare,
  PawPrint,
  ReceiptText,
  Send,
  Star,
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

import {
  CareUpdateService,
  type CareUpdate,
} from '@/lib/supabase/careUpdateService';

import {
  ReviewService,
  type Review,
} from '@/lib/supabase/reviewService';

import {
  getPaymentByBookingId,
  releaseEscrowForBooking,
  type Payment,
} from '@/lib/supabase/paymentService';

import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * SITTER INFO
 * ======================================================= */

interface SitterInfo {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  specialty: string | null;
  experienceYears: number | null;
  isVerified: boolean;
}

/* =========================================================
 * OWNER BOOKING DETAIL PAGE
 * ======================================================= */

export default function OwnerBookingDetailPage() {
  const params =
    useParams<{
      bookingId: string;
    }>();

  const router =
    useRouter();

  const bookingId =
    params.bookingId;

  /* =======================================================
   * GENERAL STATE
   * ===================================================== */

  const [
    profile,
    setProfile,
  ] =
    useState<CurrentProfile | null>(
      null
    );

  const [
    booking,
    setBooking,
  ] =
    useState<Booking | null>(
      null
    );

  const [
    sitter,
    setSitter,
  ] =
    useState<SitterInfo | null>(
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
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    releasingEscrow,
    setReleasingEscrow,
  ] = useState(false);

  const [
    escrowMessage,
    setEscrowMessage,
  ] = useState('');

  /* =======================================================
   * DAILY CARE STATE
   * ===================================================== */

  const [
    careUpdates,
    setCareUpdates,
  ] =
    useState<CareUpdate[]>(
      []
    );

  /* =======================================================
   * REVIEW STATE
   * ===================================================== */

  const [
    review,
    setReview,
  ] =
    useState<Review | null>(
      null
    );

  const [
    rating,
    setRating,
  ] =
    useState(0);

  const [
    hoverRating,
    setHoverRating,
  ] =
    useState(0);

  const [
    reviewComment,
    setReviewComment,
  ] =
    useState('');

  const [
    reviewSubmitting,
    setReviewSubmitting,
  ] =
    useState(false);

  const [
    reviewError,
    setReviewError,
  ] =
    useState('');

  const [
    reviewSuccess,
    setReviewSuccess,
  ] =
    useState('');

  /* =======================================================
   * LOAD DATA
   * ===================================================== */

  const loadData =
    async () => {
      try {
        setLoading(
          true
        );

        setError(
          ''
        );

        /* -------------------------------------------------
         * CHECK BOOKING ID
         * ----------------------------------------------- */

        if (
          !bookingId ||
          !isValidUuid(
            bookingId
          )
        ) {
          setError(
            'รหัสการจองไม่ถูกต้อง'
          );

          return;
        }

        /* -------------------------------------------------
         * CURRENT USER
         * ----------------------------------------------- */

        const current =
          await AuthService.getCurrentProfile();

        if (
          !current
        ) {
          router.replace(
            '/login'
          );

          return;
        }

        if (
          !current.is_active
        ) {
          await AuthService.signOut();

          router.replace(
            '/login'
          );

          return;
        }

        /* -------------------------------------------------
         * ROLE
         * ----------------------------------------------- */

        const role =
          current.role
            .trim()
            .toUpperCase();

        if (
          role !==
          'OWNER'
        ) {
          if (
            role ===
            'SITTER'
          ) {
            router.replace(
              '/sitter'
            );
          } else {
            router.replace(
              '/admin'
            );
          }

          return;
        }

        setProfile(
          current
        );

        /* -------------------------------------------------
         * LOAD BOOKING
         * ----------------------------------------------- */

        const detail =
          await BookingService.getBookingById(
            bookingId
          );

        if (
          !detail
        ) {
          setError(
            'ไม่พบข้อมูลการจอง'
          );

          return;
        }

        /* -------------------------------------------------
         * OWNER CHECK
         * ----------------------------------------------- */

        if (
          detail.ownerId !==
          current.id
        ) {
          setError(
            'คุณไม่มีสิทธิ์ดูข้อมูลการจองนี้'
          );

          return;
        }

        setBooking(
          detail
        );

        /* -------------------------------------------------
         * LOAD SITTER
         * ----------------------------------------------- */

        try {
          const {
            data: sitterData,
            error: sitterError,
          } = await supabase
            .from('sitter_profiles')
            .select(`
              id,
              user_id,
              specialty,
              experience_years,
              is_verified,
              profiles (
                display_name,
                first_name,
                last_name,
                avatar_url,
                bio
              )
            `)
            .eq(
              'id',
              detail.sitterId
            )
            .maybeSingle();

          if (sitterError) {
            throw sitterError;
          }

          if (sitterData) {
            const rawProfile =
              Array.isArray(
                sitterData.profiles
              )
                ? sitterData.profiles[0]
                : sitterData.profiles;

            const profileData =
              rawProfile as {
                display_name:
                  | string
                  | null;
                first_name:
                  | string
                  | null;
                last_name:
                  | string
                  | null;
                avatar_url:
                  | string
                  | null;
                bio:
                  | string
                  | null;
              } | null;

            const fullName = [
              profileData
                ?.first_name,
              profileData
                ?.last_name,
            ]
              .filter(Boolean)
              .join(' ')
              .trim();

            setSitter({
              id:
                sitterData.id,

              userId:
                sitterData.user_id,

              displayName:
                profileData
                  ?.display_name
                  ?.trim() ||
                fullName ||
                'ผู้รับฝากสัตว์เลี้ยง',

              avatarUrl:
                profileData
                  ?.avatar_url ??
                null,

              bio:
                profileData
                  ?.bio ??
                null,

              specialty:
                sitterData
                  .specialty ??
                null,

              experienceYears:
                sitterData
                  .experience_years ??
                null,

              isVerified:
                Boolean(
                  sitterData
                    .is_verified
                ),
            });
          } else {
            setSitter(
              null
            );
          }
        } catch (
          sitterLoadError
        ) {
          console.error(
            'LOAD SITTER INFO ERROR:',
            sitterLoadError
          );

          setSitter(
            null
          );
        }

        /* -------------------------------------------------
         * LOAD PAYMENT
         * ----------------------------------------------- */

        try {
          const paymentData =
            await getPaymentByBookingId(
              detail.id
            );

          setPayment(
            paymentData
          );
        } catch (
          paymentLoadError
        ) {
          console.error(
            'LOAD PAYMENT ERROR:',
            paymentLoadError
          );

          setPayment(
            null
          );
        }

        /* -------------------------------------------------
         * LOAD DAILY CARE
         * ----------------------------------------------- */

        if (
          detail.status ===
            'IN_PROGRESS' ||
          detail.status ===
            'COMPLETED'
        ) {
          try {
            const updates =
              await CareUpdateService.getByBookingId(
                detail.id
              );

            setCareUpdates(
              updates
            );
          } catch (
            careError
          ) {
            console.error(
              'LOAD CARE UPDATES ERROR:',
              careError
            );

            /*
             * ไม่ทำให้หน้า Booking พัง
             * หาก Daily Care โหลดไม่ได้
             */

            setCareUpdates(
              []
            );
          }
        } else {
          setCareUpdates(
            []
          );
        }

        /* -------------------------------------------------
         * LOAD REVIEW
         * ----------------------------------------------- */

        if (
          detail.status ===
          'COMPLETED'
        ) {
          try {
            const existingReview =
              await ReviewService.getByBookingId(
                detail.id
              );

            setReview(
              existingReview
            );
          } catch (
            reviewLoadError
          ) {
            console.error(
              'LOAD REVIEW ERROR:',
              reviewLoadError
            );

            setReview(
              null
            );
          }
        } else {
          setReview(
            null
          );
        }
      } catch (
        err
      ) {
        console.error(
          'LOAD OWNER BOOKING DETAIL ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดรายละเอียดการจองได้'
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
    void loadData();
  }, [bookingId]);

  /* =======================================================
   * OWNER CONFIRMS SERVICE / RELEASE ESCROW
   * ===================================================== */

  const handleReleaseEscrow = async () => {
    if (!booking || releasingEscrow) {
      return;
    }

    try {
      setReleasingEscrow(true);
      setEscrowMessage('');

      const releasedPayment =
        await releaseEscrowForBooking(
          booking.id
        );

      setPayment(releasedPayment);
      setEscrowMessage(
        'ยืนยันการรับสัตว์เลี้ยงกลับเรียบร้อยแล้ว'
      );
    } catch (err) {
      console.error(
        'RELEASE ESCROW ERROR:',
        err
      );

      setEscrowMessage(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถปล่อยยอดได้'
      );
    } finally {
      setReleasingEscrow(false);
    }
  };

  /* =======================================================
   * SUBMIT REVIEW
   * ===================================================== */

  const handleSubmitReview =
    async () => {
      if (
        !booking
      ) {
        return;
      }

      /* ---------------------------------------------------
       * STATUS
       * ------------------------------------------------- */

      if (
        booking.status !==
        'COMPLETED'
      ) {
        setReviewError(
          'สามารถรีวิวได้หลังจากการให้บริการเสร็จสิ้นแล้วเท่านั้น'
        );

        return;
      }

      /* ---------------------------------------------------
       * RATING
       * ------------------------------------------------- */

      if (
        rating < 1 ||
        rating > 5
      ) {
        setReviewError(
          'กรุณาเลือกคะแนน 1 ถึง 5 ดาว'
        );

        return;
      }

      try {
        setReviewSubmitting(
          true
        );

        setReviewError(
          ''
        );

        setReviewSuccess(
          ''
        );

        /* -------------------------------------------------
         * CREATE REVIEW
         * ----------------------------------------------- */

        const createdReview =
          await ReviewService.createReview({
            bookingId:
              booking.id,

            sitterId:
              booking.sitterId,

            rating,

            comment:
              reviewComment,
          });

        /* -------------------------------------------------
         * UPDATE UI
         * ----------------------------------------------- */

        setReview(
          createdReview
        );

        setReviewSuccess(
          'ส่งรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นของคุณ'
        );

        setRating(
          0
        );

        setHoverRating(
          0
        );

        setReviewComment(
          ''
        );
      } catch (
        err
      ) {
        console.error(
          'SUBMIT REVIEW ERROR:',
          err
        );

        setReviewError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถส่งรีวิวได้'
        );
      } finally {
        setReviewSubmitting(
          false
        );
      }
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (
    loading
  ) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-105 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs font-medium text-slate-400">
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
    error ||
    !profile ||
    !booking
  ) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() =>
            router.push(
              '/owner/bookings'
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-purple-600 transition hover:text-purple-800"
        >
          <ArrowLeft className="h-4 w-4" />

          กลับไปหน้าการจอง
        </button>

        <section className="rounded-[30px] border border-rose-100 bg-white p-8 text-center shadow-sm">
          <div className="text-sm font-bold text-rose-600">
            {error ||
              'ไม่พบข้อมูลการจอง'}
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
   * STATUS
   * ===================================================== */

  const statusInfo =
    getStatusInfo(
      booking.status
    );

  const totalDays =
    calculateDays(
      booking.startDate,
      booking.endDate
    );

  /* =======================================================
   * PAGE
   * ===================================================== */

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* =================================================
       * BACK
       * =============================================== */}

      <button
        type="button"
        onClick={() =>
          router.push(
            '/owner/bookings'
          )
        }
        className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-purple-600 transition hover:text-purple-800"
      >
        <ArrowLeft className="h-4 w-4" />

        กลับไปหน้าการจอง
      </button>

      {/* =================================================
       * HEADER
       * =============================================== */}

      <section className="overflow-hidden rounded-[30px] border border-purple-100 bg-white shadow-sm">
        <div className="bg-linear-to-r from-purple-50 via-white to-purple-50 p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
                Booking Detail
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-purple-950">
                  {booking.bookingCode ||
                    'Booking'}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                สร้างเมื่อ{' '}
                {formatDateTime(
                  booking.createdAt
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white px-5 py-4 sm:text-right">
              <div className="text-[10px] font-bold text-slate-400">
                ยอดรวม
              </div>

              <div className="mt-1 text-2xl font-black text-purple-700">
                ฿
                {formatMoney(
                  booking.totalPrice
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
       * CONTENT GRID
       * =============================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* =================================================
         * LEFT
         * =============================================== */}

        <div className="space-y-6">
          {/* ===============================================
           * BOOKING INFORMATION
           * ============================================= */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-black text-purple-950">
                รายละเอียดการฝาก
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                ข้อมูลวันฝาก จำนวนสัตว์ และค่าใช้บริการ
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="ระยะเวลาฝาก"
                value={`${formatDate(
                  booking.startDate
                )} - ${formatDate(
                  booking.endDate
                )}`}
                subValue={`${totalDays} วัน`}
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
                  <ReceiptText className="h-4 w-4" />
                }
                label="ยอดรวม"
                value={`฿${formatMoney(
                  booking.totalPrice
                )}`}
              />
            </div>
          </section>

          {/* ===============================================
           * SITTER INFORMATION
           * ============================================= */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-black text-purple-950">
                ข้อมูลผู้รับฝาก
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                ผู้รับฝากที่คุณเลือกสำหรับรายการจองนี้
              </p>
            </div>

            {sitter ? (
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-purple-50">
                  {sitter.avatarUrl ? (
                    <img
                      src={
                        sitter.avatarUrl
                      }
                      alt={
                        sitter.displayName
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-purple-400">
                      <PawPrint className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-purple-950">
                      {
                        sitter.displayName
                      }
                    </div>

                    {sitter.isVerified && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-600">
                        ยืนยันตัวตนแล้ว
                      </span>
                    )}
                  </div>

                  {sitter.specialty && (
                    <p className="mt-2 text-xs text-slate-500">
                      ความเชี่ยวชาญ:{' '}
                      {
                        sitter.specialty
                      }
                    </p>
                  )}

                  {sitter.experienceYears !==
                    null && (
                    <p className="mt-1 text-xs text-slate-500">
                      ประสบการณ์{' '}
                      {
                        sitter.experienceYears
                      }{' '}
                      ปี
                    </p>
                  )}

                  {sitter.bio && (
                    <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                      {
                        sitter.bio
                      }
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#FAF7FE] p-4 text-xs text-slate-400">
                ไม่สามารถโหลดข้อมูลผู้รับฝากได้
              </div>
            )}
          </section>

          {/* ===============================================
           * NOTES
           * ============================================= */}

          {(booking.ownerNote ||
            booking.sitterNote ||
            booking.rejectionReason) && (
            <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-black text-purple-950">
                หมายเหตุ
              </h2>

              <div className="mt-4 space-y-3">
                {booking.ownerNote && (
                  <DetailBlock
                    label="หมายเหตุของฉัน"
                    value={
                      booking.ownerNote
                    }
                  />
                )}

                {booking.sitterNote && (
                  <DetailBlock
                    label="ข้อความจากผู้รับฝาก"
                    value={
                      booking.sitterNote
                    }
                  />
                )}

                {booking.rejectionReason && (
                  <DetailBlock
                    label="เหตุผลที่ปฏิเสธ"
                    value={
                      booking.rejectionReason
                    }
                    danger
                  />
                )}
              </div>
            </section>
          )}

          {/* ===============================================
           * DAILY CARE UPDATE
           * ============================================= */}

          {(booking.status ===
            'IN_PROGRESS' ||
            booking.status ===
              'COMPLETED') && (
            <section className="overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-sm">
              <div className="border-b border-purple-50 bg-linear-to-r from-purple-50 to-white px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                    <ImageIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-black text-purple-950">
                      อัปเดตการดูแล
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      ข้อความและรูปภาพจากผู้รับฝากระหว่างการดูแล
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {careUpdates.length ===
                0 ? (
                  <div className="rounded-3xl border border-dashed border-purple-200 bg-[#FAF7FE] px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-purple-400 shadow-sm">
                      <ImageIcon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-3 text-sm font-black text-purple-950">
                      ยังไม่มีอัปเดตการดูแล
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      เมื่อผู้รับฝากส่งข้อความหรือรูปภาพ
                      ข้อมูลจะปรากฏที่นี่
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {careUpdates.map(
                      (
                        update,
                        index
                      ) => (
                        <article
                          key={
                            update.id
                          }
                          className="relative rounded-3xl border border-purple-100 bg-[#FAF7FE] p-4 sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm">
                                <PawPrint className="h-4 w-4" />
                              </div>

                              <div>
                                <div className="text-xs font-black text-purple-950">
                                  อัปเดตจากผู้รับฝาก
                                </div>

                                <div className="mt-0.5 text-[10px] text-slate-400">
                                  {formatDateTime(
                                    update.createdAt
                                  )}
                                </div>
                              </div>
                            </div>

                            {index ===
                              0 && (
                              <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-[9px] font-black text-purple-600">
                                ล่าสุด
                              </span>
                            )}
                          </div>

                          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {
                              update.message
                            }
                          </p>

                          {update.images
                            .length >
                            0 && (
                            <div
                              className={`mt-4 grid gap-2 ${
                                update
                                  .images
                                  .length ===
                                1
                                  ? 'grid-cols-1'
                                  : 'grid-cols-2'
                              }`}
                            >
                              {update.images.map(
                                (
                                  image
                                ) => (
                                  <a
                                    key={
                                      image.id
                                    }
                                    href={
                                      image.imageUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group overflow-hidden rounded-2xl bg-white"
                                  >
                                    <img
                                      src={
                                        image.imageUrl
                                      }
                                      alt="รูปอัปเดตการดูแลสัตว์เลี้ยง"
                                      className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-56"
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

          {/* ===============================================
           * RATING & REVIEW
           * ============================================= */}

          {booking.status ===
            'COMPLETED' && (
            <section className="overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-sm">
              {/* HEADER */}

              <div className="border-b border-purple-50 bg-linear-to-r from-purple-50 to-white px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                    <Star className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-black text-purple-950">
                      Rating & Review
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      ให้คะแนนและแบ่งปันประสบการณ์จากการใช้บริการ
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {/* SUCCESS */}

                {reviewSuccess && (
                  <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      {
                        reviewSuccess
                      }
                    </span>
                  </div>
                )}

                {/* ERROR */}

                {reviewError && (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                    {
                      reviewError
                    }
                  </div>
                )}

                {review ? (
                  /* =======================================
                   * EXISTING REVIEW
                   * ===================================== */

                  <div className="rounded-3xl border border-purple-100 bg-[#FAF7FE] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm">
                          <MessageSquare className="h-4 w-4" />
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-purple-950">
                            รีวิวของคุณ
                          </h3>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            ส่งเมื่อ{' '}
                            {formatDateTime(
                              review.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      {/* STARS */}

                      <div className="flex items-center gap-1">
                        {[
                          1,
                          2,
                          3,
                          4,
                          5,
                        ].map(
                          (
                            star
                          ) => (
                            <Star
                              key={
                                star
                              }
                              className={`h-5 w-5 ${
                                star <=
                                review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          )
                        )}
                      </div>
                    </div>

                    {/* SCORE */}

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        คะแนนที่ให้
                      </div>

                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-2xl font-black text-purple-950">
                          {
                            review.rating
                          }
                        </span>

                        <span className="pb-1 text-xs font-bold text-slate-400">
                          / 5
                        </span>
                      </div>
                    </div>

                    {/* COMMENT */}

                    {review.comment ? (
                      <div className="mt-3 rounded-2xl bg-white p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          ความคิดเห็น
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {
                            review.comment
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs text-slate-400">
                        ไม่มีความคิดเห็นเพิ่มเติม
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />

                      รีวิวรายการนี้เรียบร้อยแล้ว
                    </div>
                  </div>
                ) : (
                  /* =======================================
                   * REVIEW FORM
                   * ===================================== */

                  <div>
                    {/* STAR SELECT */}

                    <div className="rounded-3xl border border-purple-100 bg-[#FAF7FE] p-5">
                      <div className="text-center">
                        <h3 className="text-sm font-black text-purple-950">
                          ประสบการณ์ของคุณเป็นอย่างไร?
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          เลือกดาวเพื่อให้คะแนนผู้รับฝาก
                        </p>
                      </div>

                      <div
                        className="mt-5 flex justify-center gap-1 sm:gap-2"
                        onMouseLeave={() =>
                          setHoverRating(
                            0
                          )
                        }
                      >
                        {[
                          1,
                          2,
                          3,
                          4,
                          5,
                        ].map(
                          (
                            star
                          ) => {
                            const active =
                              star <=
                              (hoverRating ||
                                rating);

                            return (
                              <button
                                key={
                                  star
                                }
                                type="button"
                                disabled={
                                  reviewSubmitting
                                }
                                onMouseEnter={() =>
                                  setHoverRating(
                                    star
                                  )
                                }
                                onFocus={() =>
                                  setHoverRating(
                                    star
                                  )
                                }
                                onBlur={() =>
                                  setHoverRating(
                                    0
                                  )
                                }
                                onClick={() => {
                                  setRating(
                                    star
                                  );

                                  setReviewError(
                                    ''
                                  );
                                }}
                                aria-label={`ให้ ${star} ดาว`}
                                className="rounded-xl p-1.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed"
                              >
                                <Star
                                  className={`h-9 w-9 transition sm:h-10 sm:w-10 ${
                                    active
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* RATING TEXT */}

                      <div className="mt-3 text-center text-xs font-bold">
                        {rating ===
                          0 && (
                          <span className="text-slate-400">
                            ยังไม่ได้เลือกคะแนน
                          </span>
                        )}

                        {rating ===
                          1 && (
                          <span className="text-rose-500">
                            1 ดาว · ควรปรับปรุง
                          </span>
                        )}

                        {rating ===
                          2 && (
                          <span className="text-orange-500">
                            2 ดาว · พอใช้
                          </span>
                        )}

                        {rating ===
                          3 && (
                          <span className="text-amber-600">
                            3 ดาว · ดี
                          </span>
                        )}

                        {rating ===
                          4 && (
                          <span className="text-purple-600">
                            4 ดาว · ดีมาก
                          </span>
                        )}

                        {rating ===
                          5 && (
                          <span className="text-emerald-600">
                            5 ดาว · ยอดเยี่ยม
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COMMENT */}

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label
                          htmlFor="review-comment"
                          className="text-xs font-black text-purple-950"
                        >
                          แสดงความคิดเห็น
                        </label>

                        <span className="text-[10px] text-slate-400">
                          {
                            reviewComment.length
                          }
                          /1000
                        </span>
                      </div>

                      <textarea
                        id="review-comment"
                        value={
                          reviewComment
                        }
                        disabled={
                          reviewSubmitting
                        }
                        maxLength={
                          1000
                        }
                        rows={
                          5
                        }
                        onChange={(
                          event
                        ) =>
                          setReviewComment(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="เล่าประสบการณ์เกี่ยวกับการดูแล การสื่อสาร หรือสิ่งที่คุณประทับใจ..."
                        className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-purple-300 focus:ring-4 focus:ring-purple-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />

                      <p className="mt-1.5 text-[10px] leading-5 text-slate-400">
                        ความคิดเห็นไม่บังคับ
                        แต่จะช่วยให้เจ้าของสัตว์คนอื่นตัดสินใจได้ง่ายขึ้น
                      </p>
                    </div>

                    {/* SUBMIT */}

                    <button
                      type="button"
                      disabled={
                        reviewSubmitting ||
                        rating ===
                          0
                      }
                      onClick={() =>
                        void handleSubmitReview()
                      }
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300 sm:w-auto"
                    >
                      {reviewSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />

                          กำลังส่งรีวิว...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />

                          ส่งคะแนนและรีวิว
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* =================================================
         * RIGHT
         * =============================================== */}

        <aside className="space-y-5">
          {/* STATUS */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Clock3 className="h-4 w-4" />
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400">
                  สถานะการจอง
                </div>

                <div className="text-sm font-black text-purple-950">
                  {
                    statusInfo.label
                  }
                </div>
              </div>
            </div>

            <div className="mt-5">
              <BookingTimeline
                status={
                  booking.status
                }
              />
            </div>

            {/* PAYMENT STATUS */}

            <div className="mt-5 rounded-2xl border border-purple-100 bg-[#FAF7FE] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400">
                    สถานะการชำระเงิน
                  </div>

                  {payment?.payment_status ===
                  'PAID' ? (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-black text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      ชำระเงินแล้ว
                    </div>
                  ) : payment ? (
                    <div className="mt-1 text-xs font-black text-amber-600">
                      รอการชำระเงิน
                    </div>
                  ) : (
                    <div className="mt-1 text-xs font-black text-slate-500">
                      ยังไม่มีรายการชำระเงิน
                    </div>
                  )}
                </div>

                {payment?.payment_status ===
                  'PAID' && (
                  <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                    PAID
                  </div>
                )}
              </div>

              {payment?.payment_status ===
                'PAID' &&
                payment.paid_at && (
                  <div className="mt-2 text-[10px] text-slate-400">
                    ชำระเมื่อ{' '}
                    {formatDateTime(
                      payment.paid_at
                    )}
                  </div>
                )}

              {payment?.transaction_ref && (
                <div className="mt-1 break-all text-[10px] text-slate-400">
                  เลขอ้างอิง:{' '}
                  {
                    payment.transaction_ref
                  }
                </div>
              )}
            </div>

            {/* PAYMENT ACTION */}

            {booking.status ===
              'CONFIRMED' &&
              payment?.payment_status !==
                'PAID' && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/owner/bookings/${booking.id}/payment`
                    )
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white transition hover:bg-purple-700"
                >
                  <ReceiptText className="h-4 w-4" />

                  ชำระเงิน
                </button>
              )}

            {payment?.payment_status ===
              'PAID' && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/owner/bookings/${booking.id}/payment`
                  )
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
              >
                <ReceiptText className="h-4 w-4" />

                ดูรายละเอียดการชำระเงิน
              </button>
            )}

            {/* ESCROW ACTION */}

            {booking.status ===
              'COMPLETED' &&
              payment?.payment_status ===
                'PAID' &&
              payment.escrow_status ===
                'HELD' && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black text-amber-800">
                    ผู้รับฝากแจ้งว่าการดูแลเสร็จสิ้นแล้ว
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-amber-700">
                    กรุณายืนยันหลังจากได้รับสัตว์เลี้ยงกลับเรียบร้อยแล้ว
                  </p>

                  <button
                    type="button"
                    disabled={
                      releasingEscrow
                    }
                    onClick={() =>
                      void handleReleaseEscrow()
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {releasingEscrow ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        กำลังยืนยัน...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        ยืนยันว่ารับสัตว์เลี้ยงกลับแล้ว
                      </>
                    )}
                  </button>
                </div>
              )}

            {payment?.escrow_status ===
              'RELEASED' && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  การจองเสร็จสมบูรณ์
                </div>

                {payment.released_at && (
                  <p className="mt-1 text-[10px] text-emerald-600">
                    {formatDateTime(
                      payment.released_at
                    )}
                  </p>
                )}
              </div>
            )}

            {escrowMessage && (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-600">
                {escrowMessage}
              </p>
            )}

            {/* COMPLETED */}

            {booking.status ===
              'COMPLETED' && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                  <div>
                    <div className="text-xs font-black text-emerald-700">
                      ให้บริการเสร็จสิ้นแล้ว
                    </div>

                    {booking.completedAt && (
                      <div className="mt-1 text-[10px] text-emerald-600">
                        {formatDateTime(
                          booking.completedAt
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BOOKING ID */}

            <div className="mt-5 border-t border-purple-50 pt-4">
              <div className="text-[10px] font-bold text-slate-400">
                Booking ID
              </div>

              <div className="mt-1 break-all text-[10px] font-medium text-slate-500">
                {
                  booking.id
                }
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

/* =========================================================
 * BOOKING TIMELINE
 * ======================================================= */

function BookingTimeline({
  status,
}: {
  status: BookingStatus;
}) {
  const steps = [
    {
      key:
        'PENDING',
      label:
        'ส่งคำขอแล้ว',
    },

    {
      key:
        'CONFIRMED',
      label:
        'ผู้รับฝากยืนยัน',
    },

    {
      key:
        'IN_PROGRESS',
      label:
        'กำลังให้บริการ',
    },

    {
      key:
        'COMPLETED',
      label:
        'เสร็จสิ้น',
    },
  ] as const;

  const statusOrder:
    Partial<
      Record<
        BookingStatus,
        number
      >
    > = {
    PENDING:
      0,

    CONFIRMED:
      1,

    IN_PROGRESS:
      2,

    COMPLETED:
      3,
  };

  const currentIndex =
    statusOrder[
      status
    ];

  if (
    status ===
    'REJECTED'
  ) {
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-600">
        คำขอนี้ถูกปฏิเสธ
      </div>
    );
  }

  if (
    status ===
    'CANCELLED'
  ) {
    return (
      <div className="rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-500">
        การจองนี้ถูกยกเลิกแล้ว
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map(
        (
          step,
          index
        ) => {
          const active =
            currentIndex !==
              undefined &&
            index <=
              currentIndex;

          const current =
            currentIndex ===
            index;

          return (
            <div
              key={
                step.key
              }
              className="flex gap-3"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    active
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-slate-200 bg-white text-slate-300'
                  }`}
                >
                  {active ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  )}
                </div>

                {index <
                  steps.length -
                    1 && (
                  <div
                    className={`h-8 w-0.5 ${
                      active &&
                      currentIndex !==
                        undefined &&
                      index <
                        currentIndex
                        ? 'bg-purple-300'
                        : 'bg-slate-100'
                    }`}
                  />
                )}
              </div>

              <div className="pt-1">
                <div
                  className={`text-xs font-bold ${
                    current
                      ? 'text-purple-700'
                      : active
                        ? 'text-purple-950'
                        : 'text-slate-300'
                  }`}
                >
                  {
                    step.label
                  }
                </div>

                {current && (
                  <div className="mt-0.5 text-[9px] font-bold text-purple-400">
                    สถานะปัจจุบัน
                  </div>
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
 * INFO CARD
 * ======================================================= */

function InfoCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon:
    React.ReactNode;

  label:
    string;

  value:
    string;

  subValue?:
    string;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-[#FAF7FE] p-4">
      <div className="flex items-center gap-2 text-purple-600">
        {
          icon
        }

        <span className="text-[10px] font-bold text-slate-400">
          {
            label
          }
        </span>
      </div>

      <div className="mt-2 text-sm font-black text-purple-950">
        {
          value
        }
      </div>

      {subValue && (
        <div className="mt-1 text-[10px] font-medium text-slate-400">
          {
            subValue
          }
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * DETAIL BLOCK
 * ======================================================= */

function DetailBlock({
  label,
  value,
  danger = false,
}: {
  label:
    string;

  value:
    string;

  danger?:
    boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? 'border-rose-100 bg-rose-50'
          : 'border-purple-100 bg-[#FAF7FE]'
      }`}
    >
      <div
        className={`text-[10px] font-black ${
          danger
            ? 'text-rose-500'
            : 'text-purple-500'
        }`}
      >
        {
          label
        }
      </div>

      <p
        className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
          danger
            ? 'text-rose-700'
            : 'text-slate-600'
        }`}
      >
        {
          value
        }
      </p>
    </div>
  );
}

/* =========================================================
 * STATUS INFO
 * ======================================================= */

function getStatusInfo(
  status: BookingStatus
) {
  switch (
    status
  ) {
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
 * CALCULATE DAYS
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

  const difference =
    end.getTime() -
    start.getTime();

  const days =
    Math.floor(
      difference /
        (
          1000 *
          60 *
          60 *
          24
        )
    ) + 1;

  return Math.max(
    1,
    days
  );
}

/* =========================================================
 * FORMAT MONEY
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
 * FORMAT DATE
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
 * FORMAT DATE TIME
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

/* =========================================================
 * UUID
 * ======================================================= */

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
