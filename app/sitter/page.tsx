'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

import {
  SitterProfileService,
  type SitterProfileData,
} from '@/lib/supabase/sitterProfileService';

import {
  SitterDashboardService,
  type SitterDashboardStats,
} from '@/lib/supabase/sitterDashboardService';

import {
  ReviewService,
  type Review,
  type SitterRatingSummary,
} from '@/lib/supabase/reviewService';

import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * INITIAL DATA
 * ======================================================= */

const initialStats: SitterDashboardStats = {
  pendingCount: 0,
  confirmedCount: 0,
  inProgressCount: 0,
  completedCount: 0,
  totalRevenue: 0,
};

const initialRatingSummary: SitterRatingSummary = {
  averageRating: 0,
  reviewCount: 0,
};


interface SitterEarningsSummary {
  grossAmount: number;
  commissionFee: number;
  netAmount: number;
  paidCount: number;
}

const initialEarnings: SitterEarningsSummary = {
  grossAmount: 0,
  commissionFee: 0,
  netAmount: 0,
  paidCount: 0,
};


interface CurrentJob {
  id: string;
  bookingCode: string | null;
  ownerName: string;
  petName: string;
  petPhotoUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  paymentStatus: string | null;
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function SitterDashboardPage() {
  const router = useRouter();

  const [
    profile,
    setProfile,
  ] = useState<CurrentProfile | null>(
    null
  );

  const [
    sitterProfile,
    setSitterProfile,
  ] = useState<SitterProfileData | null>(
    null
  );

  const [
    stats,
    setStats,
  ] = useState<SitterDashboardStats>(
    initialStats
  );

  const [
    ratingSummary,
    setRatingSummary,
  ] = useState<SitterRatingSummary>(
    initialRatingSummary
  );

  const [
    reviews,
    setReviews,
  ] = useState<Review[]>([]);

  const [
    earnings,
    setEarnings,
  ] = useState<SitterEarningsSummary>(
    initialEarnings
  );

  const [
    currentJobs,
    setCurrentJobs,
  ] = useState<CurrentJob[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');


  const [
    updatingAvailability,
    setUpdatingAvailability,
  ] = useState(false);

  const [
    availabilityMessage,
    setAvailabilityMessage,
  ] = useState('');

  /* =======================================================
   * LOAD DASHBOARD
   * ===================================================== */

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const current =
          await AuthService.getCurrentProfile();

        if (!current) {
          router.replace('/login');
          return;
        }

        if (!current.is_active) {
          await AuthService.signOut();

          router.replace('/login');
          return;
        }

        const role =
          current.role.toUpperCase();

        if (role !== 'SITTER') {
          if (role === 'OWNER') {
            router.replace('/owner');
          } else {
            router.replace('/admin');
          }

          return;
        }

        setProfile(current);

        const sitterData =
          await SitterProfileService.getByUserId(
            current.id
          );

        /*
         * =====================================================
         * SITTER ONBOARDING GUARD
         *
         * ทุกครั้งที่ Sitter เข้ามาที่ /sitter
         * ระบบจะตรวจว่าทำขั้นตอนไหนค้างอยู่
         * แล้วพากลับไปทำต่ออัตโนมัติ
         * ===================================================
         */

        /*
         * 1. ยังไม่มี sitter_profiles
         *    = ยังไม่ได้เริ่ม Onboarding / Consent
         */
        if (!sitterData) {
          router.replace(
            '/sitter/onboarding/consent'
          );

          return;
        }

        /*
         * 2. โหลดข้อมูล Verification
         */
        const {
          data: verification,
          error: verificationError,
        } = await supabase
          .from('sitter_verifications')
          .select(`
            id,
            verification_status,
            consent_accepted,
            identity_document_url,
            selfie_url
          `)
          .eq(
            'sitter_id',
            sitterData.id
          )
          .maybeSingle();

        if (verificationError) {
          throw new Error(
            verificationError.message
          );
        }

        /*
         * ยังไม่มี verification row
         * หรือยังไม่ได้ยอมรับ PDPA
         */
        if (
          !verification ||
          verification.consent_accepted !== true
        ) {
          router.replace(
            '/sitter/onboarding/consent'
          );

          return;
        }

        const verificationStatus =
          String(
            verification.verification_status ??
              ''
          ).toUpperCase();

        /*
         * 3. ถ้า Admin ปฏิเสธ
         *    ให้ไปหน้าสถานะเพื่อดูเหตุผล/แก้ไข
         */
        if (
          verificationStatus ===
          'REJECTED'
        ) {
          router.replace(
            '/sitter/onboarding/verification-status'
          );

          return;
        }

        /*
         * 4. เอกสารยังไม่ครบ
         *    ให้กลับไปแนบเอกสารต่อ
         */
        if (
          !verification.identity_document_url ||
          !verification.selfie_url
        ) {
          router.replace(
            '/sitter/onboarding/verification'
          );

          return;
        }

        /*
         * 5. ทำ Quiz ครบแล้วและกำลังรอ Admin
         */
        if (
          verificationStatus ===
          'PENDING_APPROVAL'
        ) {
          router.replace(
            '/sitter/onboarding/verification-status'
          );

          return;
        }

        /*
         * 6. APPROVED แล้วเท่านั้น
         *    จึงเข้า Dashboard ได้
         */
        const sitterIsApproved =
          verificationStatus ===
            'APPROVED';

        if (!sitterIsApproved) {
          /*
           * หา Core Quiz ที่กำลังใช้งาน
           */
          const {
            data: coreQuiz,
            error: coreQuizError,
          } = await supabase
            .from('quiz_sets')
            .select('id')
            .eq(
              'quiz_type',
              'CORE'
            )
            .eq(
              'is_active',
              true
            )
            .order(
              'created_at',
              {
                ascending: true,
              }
            )
            .limit(1)
            .maybeSingle();

          if (coreQuizError) {
            throw new Error(
              coreQuizError.message
            );
          }

          if (!coreQuiz) {
            throw new Error(
              'ยังไม่มี Core Quiz ในระบบ'
            );
          }

          /*
           * ตรวจว่า Core Quiz ผ่านแล้วหรือยัง
           */
          const {
            data: passedCoreAttempt,
            error: coreAttemptError,
          } = await supabase
            .from('quiz_attempts')
            .select('id')
            .eq(
              'sitter_id',
              sitterData.id
            )
            .eq(
              'quiz_set_id',
              coreQuiz.id
            )
            .eq(
              'passed',
              true
            )
            .limit(1)
            .maybeSingle();

          if (coreAttemptError) {
            throw new Error(
              coreAttemptError.message
            );
          }

          /*
           * เอกสารครบ แต่ยังไม่ผ่าน Core Quiz
           */
          if (!passedCoreAttempt) {
            router.replace(
              '/sitter/onboarding/core-quiz'
            );

            return;
          }

          /*
           * Core Quiz ผ่านแล้ว
           * แต่สถานะยังไม่ PENDING_APPROVAL
           * = ยังต้องเลือก/ทำ Category Quiz ให้ครบ
           *
           * หากเคยเลือก Category ไว้ใน sessionStorage
           * แต่ปิดเว็บ ค่าอาจหายได้ จึงส่งกลับหน้า Categories
           * เพื่อให้เริ่มต่ออย่างปลอดภัย
           */
          router.replace(
            '/sitter/onboarding/categories'
          );

          return;
        }

        /*
         * ผ่าน Onboarding และ Admin อนุมัติแล้ว
         * จึงเริ่มโหลด Dashboard
         */
        setSitterProfile(
          sitterData
        );

        const [
          dashboardStats,
          reviewSummary,
          reviewItems,
          earningsSummary,
          currentJobItems,
        ] = await Promise.all([
          SitterDashboardService.getStats(
            sitterData.id
          ),

          ReviewService.getSitterRatingSummary(
            sitterData.id
          ),

          ReviewService.getBySitterId(
            sitterData.id
          ),

          getSitterEarnings(
            sitterData.id
          ),

          getCurrentJobs(
            sitterData.id
          ),
        ]);

        setStats(
          dashboardStats
        );

        setRatingSummary(
          reviewSummary
        );

        setReviews(
          reviewItems
        );

        setEarnings(
          earningsSummary
        );

        setCurrentJobs(
          currentJobItems
        );
      } catch (err) {
        console.error(
          'LOAD SITTER DASHBOARD ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้'
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [router]);

  /* =======================================================
   * AVAILABILITY
   * ===================================================== */

  const handleToggleAvailability = async () => {
    if (!sitterProfile || updatingAvailability) {
      return;
    }

    const nextValue = !sitterProfile.isAvailable;

    try {
      setUpdatingAvailability(true);
      setError('');
      setAvailabilityMessage('');

      /*
       * ตรวจการอนุมัติจาก sitter_profiles โดยตรง
       * เพราะ profile มาจาก profiles และไม่ใช่แหล่งสถานะ
       * Verification ของ Sitter
       */
      if (nextValue) {
        const {
          data: verificationData,
          error: verificationError,
        } = await supabase
          .from('sitter_profiles')
          .select(`
            is_verified,
            verification_status
          `)
          .eq('id', sitterProfile.id)
          .maybeSingle();

        if (verificationError) {
          throw new Error(
            verificationError.message
          );
        }

        const isApproved =
          verificationData?.is_verified === true ||
          String(
            verificationData?.verification_status ?? ''
          ).toUpperCase() === 'APPROVED';

        if (!isApproved) {
          setError(
            'บัญชียังไม่ได้รับการอนุมัติจาก Admin จึงยังไม่สามารถเปิดรับฝากได้'
          );
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('sitter_profiles')
        .update({
          is_available: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sitterProfile.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSitterProfile((current) =>
        current
          ? {
              ...current,
              isAvailable: nextValue,
            }
          : current
      );

      setAvailabilityMessage(
        nextValue
          ? 'เปิดรับฝากเรียบร้อยแล้ว'
          : 'ปิดรับฝากเรียบร้อยแล้ว'
      );

      window.setTimeout(() => {
        setAvailabilityMessage('');
      }, 2200);
    } catch (err) {
      console.error('UPDATE SITTER AVAILABILITY ERROR:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถอัปเดตสถานะรับฝากได้'
      );
    } finally {
      setUpdatingAvailability(false);
    }
  };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-105 flex-col items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          </div>

          <p className="text-xs font-medium text-slate-400">
            กำลังโหลดแดชบอร์ด...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  /* =======================================================
   * DISPLAY DATA
   * ===================================================== */

  const displayName =
    profile.display_name ||
    [
      profile.first_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'ผู้รับฝาก';

  const latestReviews =
    reviews.slice(
      0,
      1
    );

  const primaryJob =
    currentJobs.find(
      (job) =>
        job.status ===
        'IN_PROGRESS'
    ) ??
    currentJobs.find(
      (job) =>
        job.status ===
        'CONFIRMED'
    ) ??
    currentJobs.find(
      (job) =>
        job.status ===
        'PENDING'
    ) ??
    currentJobs[0] ??
    null;

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* =================================================
          DASHBOARD HEADER
      ================================================= */}

      <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
            PetBnB Sitter
          </p>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-purple-950 sm:text-3xl">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-slate-400 shadow-sm ring-1 ring-purple-100 sm:block">
            {ratingSummary.reviewCount > 0
              ? `★ ${ratingSummary.averageRating.toFixed(1)} · ${ratingSummary.reviewCount} รีวิว`
              : 'ยังไม่มีรีวิว'}
          </div>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-purple-500 shadow-sm ring-1 ring-purple-100"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="h-4 w-4" />

            {stats.pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">
                {stats.pendingCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {error && (
        <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold leading-5 text-amber-800">
            {error}
          </p>
        </section>
      )}

      {sitterProfile && (
        <>
          {/* =================================================
              HERO
          ================================================= */}

          <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/40 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-20 h-24 w-24 rounded-full bg-purple-300/20 blur-2xl" />

            <div className="relative">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-1 text-[9px] font-black text-purple-700">
                    <PawPrint className="h-3 w-3" />
                    Sitter Dashboard
                  </span>

                  {sitterProfile.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/90 px-3 py-1 text-[9px] font-black text-emerald-700">
                      <ShieldCheck className="h-3 w-3" />
                      ยืนยันตัวตนแล้ว
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-black leading-tight text-[#32105C] sm:text-[30px]">
                  สวัสดี {displayName} 👋
                </h2>

                <p className="mt-2 max-w-2xl text-xs leading-5 text-purple-900/60 sm:text-sm">
                  วันนี้คุณมี {stats.pendingCount + stats.confirmedCount + stats.inProgressCount} งานที่เกี่ยวข้อง
                  จัดการงานรับฝากและติดตามสถานะได้จากตรงนี้
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        '/sitter/bookings'
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition hover:bg-purple-700"
                  >
                    ดูงานรับฝาก
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={sitterProfile.isAvailable}
                    aria-label={
                      sitterProfile.isAvailable
                        ? 'ปิดรับฝาก'
                        : 'เปิดรับฝาก'
                    }
                    disabled={updatingAvailability}
                    onClick={() =>
                      void handleToggleAvailability()
                    }
                    className="inline-flex items-center gap-3 rounded-full bg-white/80 px-3 py-2 shadow-[0_6px_18px_rgba(76,29,149,0.08)] backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        sitterProfile.isAvailable
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />

                    <span
                      className={`text-[11px] font-black ${
                        sitterProfile.isAvailable
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {sitterProfile.isAvailable
                        ? 'พร้อมรับงาน'
                        : 'พักรับงาน'}
                    </span>

                    <span
                      className={`relative h-6 w-10 rounded-full transition ${
                        sitterProfile.isAvailable
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transition ${
                          sitterProfile.isAvailable
                            ? 'left-5'
                            : 'left-1'
                        }`}
                      >
                        {updatingAvailability && (
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-purple-500" />
                        )}
                      </span>
                    </span>
                  </button>
                </div>

                {availabilityMessage && (
                  <p className="mt-2 text-[9px] font-bold text-emerald-700">
                    {availabilityMessage}
                  </p>
                )}
              </div>

            </div>
          </section>

          {/* =================================================
              MINI CARDS
          ================================================= */}

          <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <PastelStatCard
              label="คำขอใหม่"
              value={String(stats.pendingCount)}
              subtext="รอการตอบรับ"
              icon={<Clock3 className="h-4 w-4" />}
              tone="yellow"
            />

            <PastelStatCard
              label="ยืนยันแล้ว"
              value={String(stats.confirmedCount)}
              subtext="รอเริ่มบริการ"
              icon={<CalendarDays className="h-4 w-4" />}
              tone="purple"
            />

            <PastelStatCard
              label="กำลังดูแล"
              value={String(stats.inProgressCount)}
              subtext="งานที่ดำเนินอยู่"
              icon={<PawPrint className="h-4 w-4" />}
              tone="green"
            />

            <PastelStatCard
              label="รายได้สุทธิ"
              value={formatMoney(earnings.netAmount)}
              subtext={`${earnings.paidCount} งานที่ชำระแล้ว`}
              icon={<Wallet className="h-4 w-4" />}
              tone="pink"
            />
          </section>

          {/* =================================================
              BENTO GRID
          ================================================= */}

          <section className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            {/* LATEST JOB */}

            <article className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.06)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                    Current Job
                  </p>

                  <h2 className="mt-1 text-base font-black text-purple-950">
                    งานล่าสุด
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/sitter/bookings'
                    )
                  }
                  className="inline-flex items-center gap-1 text-[10px] font-black text-purple-600"
                >
                  ดูทั้งหมด
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {primaryJob ? (
                <DashboardJobCard
                  job={primaryJob}
                  onOpen={() =>
                    router.push(
                      `/sitter/bookings/${primaryJob.id}`
                    )
                  }
                />
              ) : (
                <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-[24px] bg-[#F8F4FF] px-5 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-purple-300 shadow-sm">
                    <PawPrint className="h-6 w-6" />
                  </div>

                  <p className="mt-3 text-sm font-black text-purple-950">
                    ยังไม่มีงานที่ต้องจัดการ
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    งานใหม่จะปรากฏในส่วนนี้
                  </p>
                </div>
              )}
            </article>

            {/* RIGHT STACK */}

            <div className="grid gap-4">
              <article className="rounded-[28px] bg-[#2E1065] p-5 text-white shadow-[0_8px_30px_rgba(46,16,101,0.12)] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-200">
                      Earnings
                    </p>

                    <h2 className="mt-1 text-sm font-black">
                      รายได้ของฉัน
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>

                <p className="mt-5 text-3xl font-black tracking-tight">
                  {formatMoney(
                    earnings.netAmount
                  )}
                </p>

                <p className="mt-1 text-[10px] text-purple-200">
                  รายได้สุทธิหลังหักค่าธรรมเนียม 10%
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-[8px] font-bold text-purple-200">
                      Owner ชำระ
                    </p>

                    <p className="mt-1 text-xs font-black">
                      {formatMoney(
                        earnings.grossAmount
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-[8px] font-bold text-purple-200">
                      ค่าธรรมเนียม
                    </p>

                    <p className="mt-1 text-xs font-black">
                      {formatMoney(
                        earnings.commissionFee
                      )}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] bg-[#FFF9F0] p-5 shadow-[0_8px_30px_rgba(76,29,149,0.04)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500">
                      Reviews
                    </p>

                    <h2 className="mt-1 text-sm font-black text-purple-950">
                      รีวิวล่าสุด
                    </h2>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-current text-amber-400" />

                    <span className="text-xl font-black text-purple-950">
                      {ratingSummary.reviewCount > 0
                        ? ratingSummary.averageRating.toFixed(
                            1
                          )
                        : '0.0'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {latestReviews.length > 0 ? (
                    latestReviews.map(
                      (review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                        />
                      )
                    )
                  ) : (
                    <div className="rounded-2xl bg-white/70 p-4 text-center">
                      <MessageSquare className="mx-auto h-5 w-5 text-amber-300" />

                      <p className="mt-2 text-[10px] font-bold text-slate-400">
                        ยังไม่มีรีวิว
                      </p>
                    </div>
                  )}
                </div>
              </article>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

/* =========================================================
 * SITTER EARNINGS
 * ======================================================= */

async function getSitterEarnings(
  sitterProfileId: string
): Promise<SitterEarningsSummary> {
  const {
    data: bookingRows,
    error: bookingError,
  } = await supabase
    .from('bookings')
    .select('id')
    .eq(
      'sitter_id',
      sitterProfileId
    );

  if (bookingError) {
    console.error(
      'GET SITTER EARNINGS BOOKINGS ERROR:',
      bookingError
    );

    throw new Error(
      bookingError.message
    );
  }

  const bookingIds =
    (bookingRows ?? []).map(
      (item) => item.id
    );

  if (bookingIds.length === 0) {
    return initialEarnings;
  }

  const {
    data: payments,
    error: paymentError,
  } = await supabase
    .from('payments')
    .select(`
      amount,
      commission_fee,
      net_amount,
      payment_status
    `)
    .in(
      'booking_id',
      bookingIds
    )
    .eq(
      'payment_status',
      'PAID'
    );

  if (paymentError) {
    console.error(
      'GET SITTER EARNINGS PAYMENTS ERROR:',
      paymentError
    );

    throw new Error(
      paymentError.message
    );
  }

  return (payments ?? []).reduce(
    (
      summary,
      payment
    ) => ({
      grossAmount:
        summary.grossAmount +
        Number(
          payment.amount ?? 0
        ),

      commissionFee:
        summary.commissionFee +
        Number(
          payment.commission_fee ?? 0
        ),

      netAmount:
        summary.netAmount +
        Number(
          payment.net_amount ?? 0
        ),

      paidCount:
        summary.paidCount + 1,
    }),
    {
      grossAmount: 0,
      commissionFee: 0,
      netAmount: 0,
      paidCount: 0,
    }
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
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}

/* =========================================================
 * CURRENT JOBS
 * ======================================================= */

async function getCurrentJobs(
  sitterProfileId: string
): Promise<CurrentJob[]> {
  const {
    data: bookings,
    error: bookingError,
  } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
      owner_id,
      pet_id,
      start_date,
      end_date,
      status,
      total_price,
      created_at
    `)
    .eq(
      'sitter_id',
      sitterProfileId
    )
    .in(
      'status',
      [
        'PENDING',
        'CONFIRMED',
        'IN_PROGRESS',
      ]
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    )
    .limit(6);

  if (bookingError) {
    console.error(
      'GET CURRENT JOBS ERROR:',
      bookingError
    );

    throw new Error(
      bookingError.message
    );
  }

  if (!bookings?.length) {
    return [];
  }

  const ownerIds = [
    ...new Set(
      bookings.map(
        (item) => item.owner_id
      )
    ),
  ];

  const petIds = [
    ...new Set(
      bookings.map(
        (item) => item.pet_id
      )
    ),
  ];

  const bookingIds =
    bookings.map(
      (item) => item.id
    );

  const [
    ownerResult,
    petResult,
    paymentResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        first_name,
        last_name
      `)
      .in(
        'id',
        ownerIds
      ),

    supabase
      .from('pets')
      .select(`
        id,
        name,
        photo_url
      `)
      .in(
        'id',
        petIds
      ),

    supabase
      .from('payments')
      .select(`
        booking_id,
        payment_status
      `)
      .in(
        'booking_id',
        bookingIds
      ),
  ]);

  if (ownerResult.error) {
    throw new Error(
      ownerResult.error.message
    );
  }

  if (petResult.error) {
    throw new Error(
      petResult.error.message
    );
  }

  if (paymentResult.error) {
    throw new Error(
      paymentResult.error.message
    );
  }

  const ownerMap =
    new Map(
      (ownerResult.data ?? []).map(
        (owner) => {
          const fullName = [
            owner.first_name,
            owner.last_name,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();

          return [
            owner.id,
            owner.display_name?.trim() ||
              fullName ||
              'เจ้าของสัตว์เลี้ยง',
          ];
        }
      )
    );

  const petMap =
    new Map(
      (petResult.data ?? []).map(
        (pet) => [
          pet.id,
          pet,
        ]
      )
    );

  const paymentMap =
    new Map(
      (paymentResult.data ?? []).map(
        (payment) => [
          payment.booking_id,
          payment.payment_status,
        ]
      )
    );

  return bookings.map(
    (item) => {
      const pet =
        petMap.get(
          item.pet_id
        );

      return {
        id:
          item.id,

        bookingCode:
          item.booking_code,

        ownerName:
          ownerMap.get(
            item.owner_id
          ) ||
          'เจ้าของสัตว์เลี้ยง',

        petName:
          pet?.name ||
          'สัตว์เลี้ยง',

        petPhotoUrl:
          pet?.photo_url ??
          null,

        startDate:
          item.start_date,

        endDate:
          item.end_date,

        status:
          item.status,

        totalPrice:
          Number(
            item.total_price ??
            0
          ),

        paymentStatus:
          paymentMap.get(
            item.id
          ) ??
          null,
      };
    }
  );
}

/* =========================================================
 * CURRENT JOB CARD
 * ======================================================= */

function CurrentJobCard({
  job,
  onOpen,
}: {
  job: CurrentJob;
  onOpen: () => void;
}) {
  const status =
    getCurrentJobStatus(
      job.status
    );

  const paymentPaid =
    job.paymentStatus ===
    'PAID';

  return (
    <div className="rounded-2xl border border-purple-100 bg-[#FAF7FE] p-3.5">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
          {job.petPhotoUrl ? (
            <img
              src={
                job.petPhotoUrl
              }
              alt={
                job.petName
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-purple-300">
              <PawPrint className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="truncate text-sm font-black text-purple-950">
                {job.petName}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                เจ้าของ: {job.ownerName}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500">
            <span>
              {formatShortDate(
                job.startDate
              )}{' '}
              -{' '}
              {formatShortDate(
                job.endDate
              )}
            </span>

            {job.status ===
              'CONFIRMED' && (
              <span
                className={`font-black ${
                  paymentPaid
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {paymentPaid
                  ? 'ชำระเงินแล้ว'
                  : 'รอการชำระเงิน'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-2 text-[10px] font-black text-purple-700 transition hover:bg-purple-50"
        >
          ดูรายละเอียด
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
 * CURRENT JOB STATUS
 * ======================================================= */

function getCurrentJobStatus(
  status: string
) {
  switch (status) {
    case 'PENDING':
      return {
        label:
          'คำขอใหม่',
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
 * EARNING SUMMARY ROW
 * ======================================================= */

function EarningSummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`text-xs ${
          emphasis
            ? 'font-black text-purple-950'
            : 'text-slate-500'
        }`}
      >
        {label}
      </span>

      <span
        className={`text-right ${
          emphasis
            ? 'text-lg font-black text-emerald-700'
            : 'text-sm font-black text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
 * FORMAT SHORT DATE
 * ======================================================= */

function formatShortDate(
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
    }
  ).format(date);
}

/* =========================================================
 * PASTEL STAT CARD
 * ======================================================= */

function PastelStatCard({
  label,
  value,
  subtext,
  icon,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
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
    <article className="rounded-[24px] bg-white p-4 shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          {icon}
        </div>

        <span className="text-[9px] font-bold text-slate-300">
          PetBnB
        </span>
      </div>

      <p className="mt-4 text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xl font-black tracking-tight text-purple-950">
        {value}
      </p>

      <p className="mt-1 text-[9px] text-slate-400">
        {subtext}
      </p>
    </article>
  );
}

/* =========================================================
 * DASHBOARD JOB CARD
 * ======================================================= */

function DashboardJobCard({
  job,
  onOpen,
}: {
  job: CurrentJob;
  onOpen: () => void;
}) {
  const status =
    getCurrentJobStatus(
      job.status
    );

  const paymentPaid =
    job.paymentStatus ===
    'PAID';

  return (
    <div className="mt-5 grid gap-4 rounded-[24px] bg-[#F8F4FF] p-4 sm:grid-cols-[110px_1fr] sm:p-5">
      <div className="h-28 overflow-hidden rounded-[20px] bg-white">
        {job.petPhotoUrl ? (
          <img
            src={job.petPhotoUrl}
            alt={job.petName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-purple-300">
            <PawPrint className="h-9 w-9" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-purple-950">
                {job.petName}
              </h3>

              <span
                className={`rounded-full px-2.5 py-1 text-[8px] font-black ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <p className="mt-1 text-[10px] text-slate-400">
              เจ้าของ {job.ownerName}
            </p>
          </div>

          <p className="text-sm font-black text-purple-700">
            {formatMoney(
              job.totalPrice
            )}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-slate-500">
            {formatShortDate(
              job.startDate
            )}{' '}
            -{' '}
            {formatShortDate(
              job.endDate
            )}
          </span>

          {job.status ===
            'CONFIRMED' && (
            <span
              className={`rounded-full px-3 py-1.5 text-[9px] font-black ${
                paymentPaid
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {paymentPaid
                ? 'ชำระเงินแล้ว'
                : 'รอชำระเงิน'}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="truncate text-[9px] text-slate-400">
            {job.bookingCode ||
              'Booking'}
          </span>

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-purple-700"
          >
            {job.status ===
            'IN_PROGRESS'
              ? 'อัปเดตการดูแล'
              : 'ดูรายละเอียด'}

            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * REVIEW CARD
 * ======================================================= */

function ReviewCard({
  review,
}: {
  review: Review;
}) {
  return (
    <article className="rounded-2xl border border-purple-50 bg-white p-3.5">

      <div className="flex items-center justify-between gap-3">

        <div className="flex shrink-0 items-center gap-0.5">

          {Array.from(
            {
              length: 5,
            },
            (
              _,
              index
            ) => {
              const active =
                index <
                review.rating;

              return (
                <Star
                  key={
                    index
                  }
                  className={`h-3.5 w-3.5 ${
                    active
                      ? 'fill-current text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              );
            }
          )}

        </div>

        <span className="shrink-0 text-[9px] text-slate-400 sm:text-[10px]">
          {formatReviewDate(
            review.createdAt
          )}
        </span>

      </div>

      {review.comment ? (
        <p className="mt-2 line-clamp-2 wrap-break-word text-[11px] leading-5 text-slate-500 sm:text-xs">
          {review.comment}
        </p>
      ) : (
        <p className="mt-2 text-[11px] italic text-slate-300">
          ไม่มีความคิดเห็นเพิ่มเติม
        </p>
      )}

    </article>
  );
}

/* =========================================================
 * FORMAT REVIEW DATE
 * ======================================================= */

function formatReviewDate(
  value: string
) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
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