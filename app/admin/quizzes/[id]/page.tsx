/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import Link from 'next/link';
import {
  useParams,
  useRouter,
} from 'next/navigation';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  PawPrint,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminQuizDetail,
  AdminQuizQuestion,
  AdminQuizService,
} from '@/lib/supabase/adminQuizService';

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
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  ).format(date);
}

function getQuizTypeLabel(
  quizType: string
) {
  return quizType === 'CORE'
    ? 'แบบทดสอบพื้นฐาน'
    : 'แบบทดสอบเฉพาะประเภทสัตว์';
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminQuizDetailPage() {
  const params = useParams();
  const router = useRouter();

  const quizId =
    typeof params.id === 'string'
      ? params.id
      : '';

  const [
    quiz,
    setQuiz,
  ] = useState<AdminQuizDetail | null>(
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

  const loadQuiz =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');

          if (!quizId) {
            throw new Error(
              'ไม่พบรหัสแบบทดสอบ'
            );
          }

          const current =
            await AuthService.getCurrentProfile();

          if (!current) {
            router.replace('/login');
            return;
          }

          if (
            current.role
              .trim()
              .toUpperCase() !== 'ADMIN'
          ) {
            router.replace('/');
            return;
          }

          const data =
            await AdminQuizService.getQuizById(
              quizId
            );

          setQuiz(data);
        } catch (err) {
          console.error(
            'LOAD ADMIN QUIZ DETAIL ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดรายละเอียดแบบทดสอบได้'
          );
        } finally {
          setLoading(false);
        }
      },
      [
        quizId,
        router,
      ]
    );

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

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
              กำลังโหลดรายละเอียดแบบทดสอบ...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
   * NOT FOUND
   * ===================================================== */

  if (!quiz) {
    return (
      <main className="min-h-screen bg-[#FAF8FE] px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/quizzes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับรายการแบบทดสอบ
          </Link>

          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />

            <h1 className="mt-4 text-lg font-black text-slate-700">
              ไม่พบแบบทดสอบ
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

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* BACK */}

        <Link
          href="/admin/quizzes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />

          กลับรายการแบบทดสอบ
        </Link>

        {/* HEADER */}

        <section className="mt-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                {quiz.quizType === 'CORE' ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <PawPrint className="h-6 w-6" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-purple-600">
                  {getQuizTypeLabel(
                    quiz.quizType
                  )}
                </p>

                <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                  {quiz.titleTh}
                </h1>

                {quiz.descriptionTh && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {quiz.descriptionTh}
                  </p>
                )}
              </div>
            </div>

            <QuizActiveBadge
              active={quiz.isActive}
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

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="ประเภท"
            value={
              quiz.quizType === 'CORE'
                ? 'Core Quiz'
                : 'Category Quiz'
            }
            icon={
              <FileCheck2 className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="จำนวนคำถาม"
            value={`${quiz.questionCount} ข้อ`}
            icon={
              <ClipboardCheck className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="เกณฑ์ผ่าน"
            value={`${quiz.passingScore}%`}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="สถานะ"
            value={
              quiz.isActive
                ? 'Active'
                : 'Inactive'
            }
            icon={
              quiz.isActive ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )
            }
          />
        </section>

        {/* CATEGORY */}

        {quiz.quizType ===
          'CATEGORY' && (
          <section className="mt-5 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl">
                {quiz.categoryIcon ||
                  '🐾'}
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400">
                  ประเภทสัตว์
                </p>

                <p className="mt-1 text-sm font-black text-purple-950">
                  {quiz.categoryName ||
                    quiz.categoryId ||
                    '-'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* QUESTIONS */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-black text-purple-950 sm:text-base">
              คำถามและเฉลย
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              แสดงคำถาม ตัวเลือก
              คำตอบที่ถูกต้อง
              และคำอธิบาย
            </p>
          </div>

          {quiz.questions.length ===
          0 ? (
            <div className="flex min-h-55 flex-col items-center justify-center p-6 text-center">
              <FileCheck2 className="h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-600">
                ยังไม่มีคำถามในแบบทดสอบนี้
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-4 sm:p-6">
              {quiz.questions.map(
                (
                  question,
                  index
                ) => (
                  <QuestionCard
                    key={
                      question.id
                    }
                    question={
                      question
                    }
                    number={
                      index + 1
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* FOOTER INFO */}

        <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox
              label="สร้างเมื่อ"
              value={formatDate(
                quiz.createdAt
              )}
            />

            <InfoBox
              label="อัปเดตล่าสุด"
              value={formatDate(
                quiz.updatedAt
              )}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
 * QUESTION CARD
 * ======================================================= */

function QuestionCard({
  question,
  number,
}: {
  question: AdminQuizQuestion;
  number: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-[#FAF8FE] p-4 sm:p-5">
      {/* QUESTION */}

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-xs font-black text-white">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-black leading-6 text-purple-950">
              {question.questionTextTh}
            </h3>

            <QuestionStatus
              active={
                question.isActive
              }
            />
          </div>

          {/* CHOICES */}

          <div className="mt-4 space-y-2">
            {question.choices.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-400">
                ไม่มีตัวเลือก
              </div>
            ) : (
              question.choices.map(
                (
                  choice,
                  choiceIndex
                ) => (
                  <div
                    key={
                      choice.id
                    }
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      choice.isCorrect
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        choice.isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(
                        65 +
                          choiceIndex
                      )}
                    </div>

                    <div className="flex-1">
                      <p
                        className={`text-sm leading-6 ${
                          choice.isCorrect
                            ? 'font-bold text-emerald-800'
                            : 'text-slate-700'
                        }`}
                      >
                        {
                          choice.choiceTextTh
                        }
                      </p>

                      {choice.isCorrect && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />

                          คำตอบที่ถูกต้อง
                        </div>
                      )}
                    </div>
                  </div>
                )
              )
            )}
          </div>

          {/* EXPLANATION */}

          {question.explanationTh && (
            <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-3">
              <p className="text-[10px] font-bold text-purple-500">
                คำอธิบาย
              </p>

              <p className="mt-1 text-xs leading-5 text-purple-800">
                {
                  question.explanationTh
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
 * COMPONENTS
 * ======================================================= */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
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

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          {icon}
        </div>
      </div>
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
    <div className="rounded-xl bg-[#FAF8FE] p-3">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function QuizActiveBadge({
  active,
}: {
  active: boolean;
}) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />

        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
      <XCircle className="h-4 w-4" />

      Inactive
    </span>
  );
}

function QuestionStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-200 text-slate-500'
      }`}
    >
      {active
        ? 'Active'
        : 'Inactive'}
    </span>
  );
}