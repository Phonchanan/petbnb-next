/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminSitterListItem,
  AdminSitterService,
} from '@/lib/supabase/adminSitterService';

/* =========================================================
 * HELPERS
 * ======================================================= */

type NormalizedStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

function normalizeStatus(
  status: string | null | undefined
): NormalizedStatus {
  const value =
    status?.trim().toUpperCase() ?? '';

  if (value === 'APPROVED') {
    return 'APPROVED';
  }

  if (value === 'REJECTED') {
    return 'REJECTED';
  }

  return 'PENDING';
}

function getSitterName(
  sitter: AdminSitterListItem
): string {
  if (sitter.displayName?.trim()) {
    return sitter.displayName.trim();
  }

  const fullName = [
    sitter.firstName,
    sitter.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || 'ไม่ระบุชื่อ';
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminPage() {
  const router = useRouter();

  const [sitters, setSitters] = useState<
    AdminSitterListItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =======================================================
   * LOAD DASHBOARD
   * ===================================================== */

  const loadDashboard =
    useCallback(
      async (
        isRefresh = false
      ) => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const current =
            await AuthService.getCurrentProfile();

          if (!current) {
            router.replace('/login');
            return;
          }

          if (
            current.role
              .trim()
              .toUpperCase() !==
            'ADMIN'
          ) {
            router.replace('/');
            return;
          }

          const data =
            await AdminSitterService.getSitters();

          setSitters(data);
        } catch (err) {
          console.error(
            'LOAD ADMIN DASHBOARD ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูล Dashboard ได้'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [router]
    );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
   * STATS
   * ===================================================== */

  const stats =
    useMemo(() => {
      let pending = 0;
      let approved = 0;
      let rejected = 0;

      for (
        const sitter of
        sitters
      ) {
        const status =
          normalizeStatus(
            sitter.verificationStatus
          );

        if (
          status ===
          'APPROVED'
        ) {
          approved += 1;
        } else if (
          status ===
          'REJECTED'
        ) {
          rejected += 1;
        } else {
          pending += 1;
        }
      }

      return {
        total:
          sitters.length,
        pending,
        approved,
        rejected,
      };
    }, [sitters]);

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
              กำลังโหลดข้อมูลผู้ดูแลระบบ...
            </p>
          </div>
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
        {/* HEADER */}

        <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Admin Dashboard
                </div>

                <h1 className="mt-3 text-2xl font-black text-purple-950">
                  ระบบจัดการ PetBnB
                </h1>

                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                  ตรวจสอบผู้สมัคร Sitter
                  จัดการสมาชิก การจอง
                  และแบบทดสอบภายในระบบ
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                void loadDashboard(
                  true
                )
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              รีเฟรช
            </button>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">
                ไม่สามารถโหลดข้อมูลได้
              </p>

              <p className="mt-1 text-xs">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* STATS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Sitter ทั้งหมด"
            value={stats.total}
            icon={
              <Users className="h-5 w-5" />
            }
            iconClass="bg-purple-50 text-purple-600"
          />

          <StatCard
            title="รอตรวจสอบ"
            value={stats.pending}
            icon={
              <Clock3 className="h-5 w-5" />
            }
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="อนุมัติแล้ว"
            value={stats.approved}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="ไม่อนุมัติ"
            value={stats.rejected}
            icon={
              <AlertCircle className="h-5 w-5" />
            }
            iconClass="bg-red-50 text-red-600"
          />
        </section>

        {/* ADMIN MENU */}

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-purple-950">
              การจัดการ
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              เลือกเมนูที่ต้องการจัดการ
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminMenuCard
              href="/admin/sitters"
              icon={
                <UserCheck className="h-6 w-6" />
              }
              title="ตรวจสอบผู้สมัคร Sitter"
              description="ตรวจสอบเอกสาร ผลแบบทดสอบ และอนุมัติหรือปฏิเสธผู้สมัคร"
              badge={
                stats.pending >
                0
                  ? `${stats.pending} รายการรอตรวจสอบ`
                  : undefined
              }
            />

            <AdminMenuCard
              href="/admin/users"
              icon={
                <Users className="h-6 w-6" />
              }
              title="จัดการสมาชิก"
              description="ดูข้อมูล Owner, Sitter, Admin และจัดการสถานะบัญชี"
            />

            <AdminMenuCard
              href="/admin/bookings"
              icon={
                <CalendarDays className="h-6 w-6" />
              }
              title="จัดการการจอง"
              description="ตรวจสอบรายการฝากเลี้ยงและสถานะ Booking ทั้งระบบ"
            />

            <AdminMenuCard
              href="/admin/quizzes"
              icon={
                <FileCheck2 className="h-6 w-6" />
              }
              title="จัดการแบบทดสอบ"
              description="ตรวจสอบ Core Quiz และ Category Quiz สำหรับผู้สมัคร Sitter"
            />
          </div>
        </section>

        {/* PENDING SITTERS */}

        <section className="mt-7 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-purple-950 sm:text-base">
                ผู้สมัครที่รอตรวจสอบ
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                รายการที่ Admin
                ควรดำเนินการ
              </p>
            </div>

            <Link
              href="/admin/sitters"
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 transition hover:text-purple-900"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <PendingSitterList
            sitters={sitters}
          />
        </section>
      </div>
    </main>
  );
}

/* =========================================================
 * PENDING SITTER LIST
 * ======================================================= */

function PendingSitterList({
  sitters,
}: {
  sitters: AdminSitterListItem[];
}) {
  const pendingSitters =
    sitters
      .filter(
        (sitter) =>
          normalizeStatus(
            sitter.verificationStatus
          ) === 'PENDING'
      )
      .slice(0, 5);

  if (
    pendingSitters.length ===
    0
  ) {
    return (
      <div className="flex min-h-47.5 flex-col items-center justify-center px-6 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <h3 className="mt-3 text-sm font-bold text-slate-700">
          ไม่มีใบสมัครที่รอตรวจสอบ
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          เมื่อมี Sitter
          ส่งใบสมัครใหม่
          รายการจะแสดงในส่วนนี้
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {pendingSitters.map(
        (sitter) => {
          const name =
            getSitterName(
              sitter
            );

          const initial =
            name ===
            'ไม่ระบุชื่อ'
              ? 'S'
              : name
                  .charAt(0)
                  .toUpperCase();

          return (
            <div
              key={
                sitter.sitterId
              }
              className="flex flex-col gap-3 px-5 py-4 transition hover:bg-purple-50/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
                  {initial}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {name}
                  </p>

                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600">
                    <Clock3 className="h-3.5 w-3.5" />

                    รอการตรวจสอบ
                  </p>
                </div>
              </div>

              <Link
                href={`/admin/sitters/${sitter.sitterId}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700"
              >
                ตรวจสอบ

                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
 * STAT CARD
 * ======================================================= */

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-black text-purple-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * ADMIN MENU CARD
 * ======================================================= */

function AdminMenuCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
          {icon}
        </div>

        <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-purple-600" />
      </div>

      <h3 className="mt-4 font-black text-purple-950">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>

      {badge && (
        <div className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
          {badge}
        </div>
      )}
    </Link>
  );
}