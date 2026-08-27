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
  PawPrint,
  UserRound,
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

const initialStats: SitterDashboardStats = {
  pendingCount: 0,
  confirmedCount: 0,
  inProgressCount: 0,
  completedCount: 0,
  totalRevenue: 0,
};

export default function SitterDashboardPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [sitterProfile, setSitterProfile] =
    useState<SitterProfileData | null>(null);

  const [stats, setStats] =
    useState<SitterDashboardStats>(
      initialStats
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

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

        if (
          current.role.toUpperCase() !==
          'SITTER'
        ) {
          if (
            current.role.toUpperCase() ===
            'OWNER'
          ) {
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

        setSitterProfile(sitterData);

        const dashboardStats =
          await SitterDashboardService.getStats(
            sitterData.id
          );

        setStats(
          dashboardStats
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

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* WELCOME */}
      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
          <PawPrint className="h-3.5 w-3.5" />
          Sitter Dashboard
        </div>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#2E1065]">
              สวัสดี {displayName} 👋
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              จัดการคำขอจอง บริการ
              และข้อมูลการรับฝากสัตว์เลี้ยงของคุณ
            </p>
          </div>

          {sitterProfile && (
            <div
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
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

      {/* ERROR */}
      {error && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <p className="font-bold">
            {error}
          </p>

          {!sitterProfile && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  '/sitter/profile'
                )
              }
              className="mt-3 rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white"
            >
              สร้างโปรไฟล์ผู้รับฝาก
            </button>
          )}
        </div>
      )}

      {/* STATS */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={
            <Clock3 className="h-5 w-5" />
          }
          label="คำขอใหม่"
          value={String(
            stats.pendingCount
          )}
          description="รอการตอบรับ"
        />

        <StatCard
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          label="ยืนยันแล้ว"
          value={String(
            stats.confirmedCount
          )}
          description="รายการ"
        />

        <StatCard
          icon={
            <PawPrint className="h-5 w-5" />
          }
          label="กำลังดูแล"
          value={String(
            stats.inProgressCount
          )}
          description="รายการ"
        />

        <StatCard
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          label="เสร็จสิ้น"
          value={String(
            stats.completedCount
          )}
          description="รายการ"
        />

        <StatCard
          icon={
            <Wallet className="h-5 w-5" />
          }
          label="รายได้รวม"
          value={`฿${stats.totalRevenue.toLocaleString(
            'th-TH'
          )}`}
          description="จากงานที่เสร็จสิ้น"
        />
      </section>

      {/* MAIN GRID */}
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* BOOKING */}
        <article className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-purple-950">
                คำขอจอง
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                ตรวจสอบคำขอใหม่
                และจัดการสถานะการรับฝาก
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FAF7FE] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                รอการตอบรับ
              </span>

              <span className="text-xl font-black text-purple-700">
                {stats.pendingCount}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                ยืนยันแล้ว
              </span>

              <span className="text-xl font-black text-purple-700">
                {stats.confirmedCount}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                กำลังดูแล
              </span>

              <span className="text-xl font-black text-purple-700">
                {stats.inProgressCount}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/sitter/bookings'
              )
            }
            className="mt-5 w-full rounded-2xl bg-purple-600 py-3 text-xs font-bold text-white transition hover:bg-purple-700"
          >
            ดูคำขอจองทั้งหมด
          </button>
        </article>

        {/* PROFILE */}
        <article className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-purple-950">
                โปรไฟล์ผู้รับฝาก
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                จัดการพื้นที่ ที่พัก
                ราคา และสถานะพร้อมรับฝาก
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <UserRound className="h-5 w-5" />
            </div>
          </div>

          {sitterProfile ? (
            <div className="mt-5 space-y-3 rounded-2xl bg-[#FAF7FE] p-4">
              <InfoRow
                label="ประสบการณ์"
                value={`${sitterProfile.experienceYears} ปี`}
              />

              <InfoRow
                label="ราคาเริ่มต้น"
                value={`฿${sitterProfile.startingPrice.toLocaleString(
                  'th-TH'
                )}`}
              />

              <InfoRow
                label="สถานะ"
                value={
                  sitterProfile.isAvailable
                    ? 'พร้อมรับฝาก'
                    : 'ปิดรับฝาก'
                }
              />

              <InfoRow
                label="การยืนยัน"
                value={
                  sitterProfile.isVerified
                    ? 'ยืนยันแล้ว'
                    : sitterProfile.verificationStatus
                }
              />
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-purple-200 bg-purple-50 p-5 text-center text-xs text-slate-500">
              ยังไม่มีโปรไฟล์ผู้รับฝาก
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              router.push(
                '/sitter/profile'
              )
            }
            className="mt-5 w-full rounded-2xl border border-purple-200 bg-purple-50 py-3 text-xs font-bold text-purple-700 transition hover:bg-purple-100"
          >
            จัดการโปรไฟล์
          </button>
        </article>
      </section>

      {/* SERVICES + REVENUE */}
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <article className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <PawPrint className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-purple-950">
                บริการของฉัน
              </h2>

              <p className="text-xs text-slate-400">
                เพิ่มหรือแก้ไขบริการที่เปิดรับ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/sitter/services'
              )
            }
            className="mt-5 w-full rounded-2xl border border-purple-200 bg-white py-3 text-xs font-bold text-purple-700 transition hover:bg-purple-50"
          >
            จัดการบริการ
          </button>
        </article>

        <article className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-purple-950">
                สรุปรายได้
              </h2>

              <p className="text-xs text-slate-400">
                รายได้จากงานที่เสร็จสิ้นแล้ว
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
            <div className="text-xs font-bold text-emerald-700">
              รายได้รวม
            </div>

            <div className="mt-1 text-3xl font-black text-emerald-700">
              ฿
              {stats.totalRevenue.toLocaleString(
                'th-TH'
              )}
            </div>

            <div className="mt-1 text-[10px] text-emerald-600">
              จาก {stats.completedCount}{' '}
              งานที่เสร็จสิ้น
            </div>
          </div>
        </article>
      </section>

      {/* ACCOUNT */}
      <section className="mt-6 rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-purple-100 text-purple-600">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="text-sm font-black text-purple-950">
                {displayName}
              </h2>

              <p className="text-xs text-slate-400">
                {profile.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/sitter/profile'
              )
            }
            className="rounded-full bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700"
          >
            แก้ไขโปรไฟล์
          </button>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
        {icon}
      </div>

      <div className="mt-4 text-xs font-bold text-slate-400">
        {label}
      </div>

      <div className="mt-1 wrap-break-word text-2xl font-black text-purple-950">
        {value}
      </div>

      <div className="mt-1 text-[10px] text-slate-400">
        {description}
      </div>
    </article>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span className="text-xs font-bold text-purple-950">
        {value}
      </span>
    </div>
  );
}