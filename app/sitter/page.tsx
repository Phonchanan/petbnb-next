'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquare,
  PawPrint,
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
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
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

        if (!sitterData) {
          setSitterProfile(null);

          setError(
            'คุณยังไม่ได้สร้างโปรไฟล์ผู้รับฝาก กรุณาสร้างโปรไฟล์ก่อนเริ่มรับงาน'
          );

          return;
        }

        setSitterProfile(
          sitterData
        );

        const [
          dashboardStats,
          reviewSummary,
          reviewItems,
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
      2
    );

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">

      {/* =================================================
          WELCOME
      ================================================= */}

      <section className="rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[10px] font-bold text-purple-700 sm:text-[11px]">
              <PawPrint className="h-3.5 w-3.5" />

              Sitter Dashboard
            </div>

            <h1 className="mt-3 wrap-break-word text-xl font-black text-purple-950 sm:text-2xl">
              สวัสดี {displayName} 👋
            </h1>

            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
              ภาพรวมการรับฝากสัตว์เลี้ยงของคุณ
            </p>
          </div>

          {sitterProfile && (
            <div
              className={`w-fit shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold ${
                sitterProfile.isAvailable
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {sitterProfile.isAvailable
                ? '● พร้อมรับฝาก'
                : '● ปิดรับฝาก'}
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold leading-5 text-amber-800">
            {error}
          </p>
        </section>
      )}

      {sitterProfile && (
        <>
          {/* =================================================
              OVERVIEW
          ================================================= */}

          <section className="mt-5">
            <h2 className="mb-3 text-sm font-black text-purple-950">
              ภาพรวม
            </h2>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">

              <OverviewCard
                icon={
                  <Clock3 className="h-3.5 w-3.5" />
                }
                label="คำขอใหม่"
                value={String(
                  stats.pendingCount
                )}
                subtext="รอการตอบรับ"
              />

              <OverviewCard
                icon={
                  <PawPrint className="h-3.5 w-3.5" />
                }
                label="กำลังดูแล"
                value={String(
                  stats.inProgressCount
                )}
                subtext="รายการ"
              />

              <OverviewCard
                icon={
                  <CheckCircle2 className="h-3.5 w-3.5" />
                }
                label="เสร็จสิ้น"
                value={String(
                  stats.completedCount
                )}
                subtext="รายการ"
              />

              <OverviewCard
                icon={
                  <Wallet className="h-3.5 w-3.5" />
                }
                label="รายได้รวม"
                value={`฿${stats.totalRevenue.toLocaleString(
                  'th-TH'
                )}`}
                subtext="จากงานที่เสร็จสิ้น"
              />

            </div>
          </section>

          {/* =================================================
              WORK + REVIEW
          ================================================= */}

          <section className="mt-5 grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5">

            {/* ===============================================
                MY WORK
            =============================================== */}

            <article className="flex h-full min-w-0 flex-col rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-black text-purple-950">
                    งานของฉัน
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    สถานะงานรับฝากในปัจจุบัน
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 flex-1 rounded-2xl bg-[#FAF7FE] p-2">

                <BookingRow
                  label="รอการตอบรับ"
                  value={
                    stats.pendingCount
                  }
                />

                <BookingRow
                  label="ยืนยันแล้ว"
                  value={
                    stats.confirmedCount
                  }
                />

                <BookingRow
                  label="กำลังดูแล"
                  value={
                    stats.inProgressCount
                  }
                />

                <BookingRow
                  label="เสร็จสิ้นแล้ว"
                  value={
                    stats.completedCount
                  }
                />

              </div>
            </article>

            {/* ===============================================
                REVIEWS
            =============================================== */}

            <article className="flex h-full min-w-0 flex-col rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">
                  <h2 className="text-base font-black text-purple-950">
                    รีวิวจากเจ้าของสัตว์
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    คะแนนและความคิดเห็นจาก Owner
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <MessageSquare className="h-4 w-4" />
                </div>

              </div>

              {/* RATING SUMMARY */}

              <div className="mt-4 rounded-2xl bg-[#FAF7FE] p-3.5 sm:p-4">

                {ratingSummary.reviewCount >
                0 ? (
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Star className="h-5 w-5 fill-current text-amber-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-end gap-1.5">
                        <span className="text-xl font-black text-purple-950">
                          {ratingSummary.averageRating.toFixed(
                            1
                          )}
                        </span>

                        <span className="mb-0.5 text-[10px] font-bold text-slate-400">
                          / 5
                        </span>
                      </div>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        จาก{' '}
                        {
                          ratingSummary.reviewCount
                        }{' '}
                        รีวิว
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Star className="h-5 w-5 text-slate-200" />
                    </div>

                    <div>
                      <p className="text-xs font-black text-purple-950">
                        ยังไม่มีคะแนน
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        คะแนนจะแสดงเมื่อ Owner รีวิว
                      </p>
                    </div>

                  </div>
                )}

              </div>

              {/* LATEST REVIEWS */}

              <div className="mt-3 flex-1">

                {latestReviews.length >
                0 ? (
                  <div className="space-y-2.5">

                    {latestReviews.map(
                      (review) => (
                        <ReviewCard
                          key={
                            review.id
                          }
                          review={
                            review
                          }
                        />
                      )
                    )}

                  </div>
                ) : (
                  <div className="flex min-h-24 h-full flex-col items-center justify-center rounded-2xl border border-dashed border-purple-100 bg-purple-50/20 px-4 text-center">

                    <Star className="h-4.5 w-4.5 text-purple-200" />

                    <p className="mt-2 text-[11px] font-bold text-slate-400">
                      ยังไม่มีรีวิว
                    </p>

                  </div>
                )}

              </div>
            </article>

          </section>
        </>
      )}
    </main>
  );
}

/* =========================================================
 * OVERVIEW CARD
 * ======================================================= */

function OverviewCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <article className="min-w-0 rounded-[18px] border border-purple-100 bg-white p-3.5 shadow-sm sm:p-4">

      <div className="flex items-center justify-between gap-2">

        <p className="truncate text-[10px] font-bold text-slate-400 sm:text-[11px]">
          {label}
        </p>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          {icon}
        </div>

      </div>

      <p className="mt-2 truncate text-lg font-black text-purple-950 sm:text-xl">
        {value}
      </p>

      <p className="mt-0.5 truncate text-[9px] text-slate-400 sm:text-[10px]">
        {subtext}
      </p>

    </article>
  );
}

/* =========================================================
 * BOOKING ROW
 * ======================================================= */

function BookingRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2">

      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span className="min-w-8 rounded-full bg-white px-2.5 py-1 text-center text-xs font-black text-purple-700 shadow-sm">
        {value}
      </span>

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