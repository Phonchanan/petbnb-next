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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  Loader2,
  PawPrint,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminQuizListItem,
  AdminQuizService,
  AdminQuizType,
} from '@/lib/supabase/adminQuizService';

/* =========================================================
 * TYPES
 * ======================================================= */

type QuizFilter =
  | 'ALL'
  | AdminQuizType;

type ActiveFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'INACTIVE';

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

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'th-TH',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

function getQuizTypeLabel(
  quizType: AdminQuizType
) {
  return quizType === 'CORE'
    ? 'แบบทดสอบพื้นฐาน'
    : 'แบบทดสอบเฉพาะประเภท';
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminQuizzesPage() {
  const router = useRouter();

  const [
    quizzes,
    setQuizzes,
  ] = useState<AdminQuizListItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    quizFilter,
    setQuizFilter,
  ] = useState<QuizFilter>('ALL');

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<ActiveFilter>('ALL');

  /* =======================================================
   * LOAD
   * ===================================================== */

  const loadQuizzes =
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
            current.role.toUpperCase() !==
            'ADMIN'
          ) {
            router.replace('/');
            return;
          }

          const data =
            await AdminQuizService.getQuizzes();

          setQuizzes(data);
        } catch (err) {
          console.error(
            'LOAD ADMIN QUIZZES ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดแบบทดสอบได้'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [router]
    );

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  /* =======================================================
   * STATS
   * ===================================================== */

  const stats = useMemo(() => {
    let core = 0;
    let category = 0;
    let active = 0;
    let inactive = 0;

    for (const quiz of quizzes) {
      if (
        quiz.quizType === 'CORE'
      ) {
        core += 1;
      }

      if (
        quiz.quizType === 'CATEGORY'
      ) {
        category += 1;
      }

      if (quiz.isActive) {
        active += 1;
      } else {
        inactive += 1;
      }
    }

    return {
      total: quizzes.length,
      core,
      category,
      active,
      inactive,
    };
  }, [quizzes]);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredQuizzes =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return quizzes.filter(
        (quiz) => {
          if (
            quizFilter !== 'ALL' &&
            quiz.quizType !== quizFilter
          ) {
            return false;
          }

          if (
            activeFilter === 'ACTIVE' &&
            !quiz.isActive
          ) {
            return false;
          }

          if (
            activeFilter === 'INACTIVE' &&
            quiz.isActive
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchText = [
            quiz.titleTh,
            quiz.descriptionTh,
            quiz.categoryName,
            quiz.categoryId,
            quiz.quizType,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchText.includes(
            keyword
          );
        }
      );
    }, [
      quizzes,
      search,
      quizFilter,
      activeFilter,
    ]);

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
              กำลังโหลดแบบทดสอบ...
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
        {/* BACK */}

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-purple-700"
        >
          <ChevronLeft className="h-4 w-4" />

          กลับหน้าหลัก Admin
        </Link>

        {/* HEADER */}

        <section className="mt-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <FileCheck2 className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-purple-600">
                  Quiz Management
                </p>

                <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                  จัดการแบบทดสอบ
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  ตรวจสอบ Core Quiz และ
                  Category Quiz
                  สำหรับผู้สมัคร Sitter
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                void loadQuizzes(true)
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
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
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            {error}
          </div>
        )}

        {/* STATS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="แบบทดสอบทั้งหมด"
            value={stats.total}
            icon={
              <ClipboardList className="h-5 w-5" />
            }
          />

          <StatCard
            label="Core Quiz"
            value={stats.core}
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
          />

          <StatCard
            label="Category Quiz"
            value={stats.category}
            icon={
              <PawPrint className="h-5 w-5" />
            }
          />

          <StatCard
            label="กำลังใช้งาน"
            value={stats.active}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />
        </section>

        {/* SEARCH + FILTER */}

        <section className="mt-5 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ค้นหาชื่อแบบทดสอบ หรือประเภทสัตว์..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton
                active={
                  quizFilter === 'ALL'
                }
                onClick={() =>
                  setQuizFilter('ALL')
                }
              >
                ทั้งหมด
              </FilterButton>

              <FilterButton
                active={
                  quizFilter === 'CORE'
                }
                onClick={() =>
                  setQuizFilter('CORE')
                }
              >
                Core Quiz
              </FilterButton>

              <FilterButton
                active={
                  quizFilter ===
                  'CATEGORY'
                }
                onClick={() =>
                  setQuizFilter(
                    'CATEGORY'
                  )
                }
              >
                Category Quiz
              </FilterButton>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton
                active={
                  activeFilter ===
                  'ALL'
                }
                onClick={() =>
                  setActiveFilter(
                    'ALL'
                  )
                }
              >
                ทุกสถานะ
              </FilterButton>

              <FilterButton
                active={
                  activeFilter ===
                  'ACTIVE'
                }
                onClick={() =>
                  setActiveFilter(
                    'ACTIVE'
                  )
                }
              >
                Active
              </FilterButton>

              <FilterButton
                active={
                  activeFilter ===
                  'INACTIVE'
                }
                onClick={() =>
                  setActiveFilter(
                    'INACTIVE'
                  )
                }
              >
                Inactive
              </FilterButton>
            </div>
          </div>
        </section>

        {/* LIST */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-black text-purple-950 sm:text-base">
              รายการแบบทดสอบ
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredQuizzes.length}{' '}
              รายการ
            </p>
          </div>

          {filteredQuizzes.length ===
          0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center p-6 text-center">
              <FileCheck2 className="h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-600">
                ไม่พบแบบทดสอบ
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {filteredQuizzes.map(
                (quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
 * QUIZ CARD
 * ======================================================= */

function QuizCard({
  quiz,
}: {
  quiz: AdminQuizListItem;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-purple-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl">
            {quiz.quizType ===
            'CORE'
              ? '🛡️'
              : quiz.categoryIcon ||
                '🐾'}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-purple-500">
              {getQuizTypeLabel(
                quiz.quizType
              )}
            </p>

            <h3 className="mt-1 text-sm font-black leading-6 text-purple-950">
              {quiz.titleTh}
            </h3>
          </div>
        </div>

        <ActiveBadge
          active={quiz.isActive}
        />
      </div>

      {quiz.categoryName && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-[10px] font-bold text-purple-700">
          <PawPrint className="h-3 w-3" />

          {quiz.categoryName}
        </div>
      )}

      {quiz.descriptionTh && (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">
          {quiz.descriptionTh}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniInfo
          label="จำนวนข้อ"
          value={`${quiz.questionCount} ข้อ`}
        />

        <MiniInfo
          label="เกณฑ์ผ่าน"
          value={`${quiz.passingScore}%`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-[10px] text-slate-400">
          อัปเดต{' '}
          {formatDate(
            quiz.updatedAt
          )}
        </p>

        <Link
          href={`/admin/quizzes/${quiz.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 transition hover:text-purple-800"
        >
          ดูรายละเอียด

          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

/* =========================================================
 * COMPONENTS
 * ======================================================= */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-black text-purple-950">
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

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
        active
          ? 'bg-purple-600 text-white'
          : 'border border-slate-200 bg-white text-slate-500 hover:bg-purple-50 hover:text-purple-700'
      }`}
    >
      {children}
    </button>
  );
}

function ActiveBadge({
  active,
}: {
  active: boolean;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />

      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
      <XCircle className="h-3 w-3" />

      Inactive
    </span>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#FAF8FE] p-3">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-purple-950">
        {value}
      </p>
    </div>
  );
}