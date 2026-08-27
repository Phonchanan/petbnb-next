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
  CheckCircle2,
  Clock3,
  FileCheck2,
  ImageIcon,
  Loader2,
  PawPrint,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

import {
  AdminSitterDetail,
  AdminSitterQuizResult,
  AdminSitterService,
} from '@/lib/supabase/adminSitterService';

/* =========================================================
 * HELPERS
 * ======================================================= */

function getDisplayName(
  sitter: AdminSitterDetail
) {
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

function normalizeStatus(
  status: string
) {
  const value =
    status.toUpperCase();

  if (value === 'APPROVED') {
    return 'APPROVED';
  }

  if (value === 'REJECTED') {
    return 'REJECTED';
  }

  return 'PENDING';
}

function getStatusLabel(
  status: string
) {
  switch (
    normalizeStatus(status)
  ) {
    case 'APPROVED':
      return 'อนุมัติแล้ว';

    case 'REJECTED':
      return 'ไม่อนุมัติ';

    default:
      return 'รอการตรวจสอบ';
  }
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function AdminSitterDetailPage() {
  const params = useParams();
  const router = useRouter();

  const sitterId =
    typeof params.id === 'string'
      ? params.id
      : '';

  const [
    sitter,
    setSitter,
  ] =
    useState<AdminSitterDetail | null>(
      null
    );

  const [
    adminUserId,
    setAdminUserId,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    rejectReason,
    setRejectReason,
  ] = useState('');

  const [
    showRejectBox,
    setShowRejectBox,
  ] = useState(false);

  /* =======================================================
   * LOAD
   * ===================================================== */

  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');
          setMessage('');

          if (!sitterId) {
            throw new Error(
              'ไม่พบรหัสผู้สมัคร'
            );
          }

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

          setAdminUserId(
            current.id
          );

          const detail =
            await AdminSitterService.getSitterById(
              sitterId
            );

          if (!detail) {
            setSitter(null);
            return;
          }

          setSitter(detail);
        } catch (err) {
          console.error(
            'LOAD SITTER DETAIL ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูลผู้สมัครได้'
          );
        } finally {
          setLoading(false);
        }
      },
      [
        sitterId,
        router,
      ]
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
   * QUIZ GROUP
   * ===================================================== */

  const coreQuiz =
    useMemo(() => {
      return (
        sitter?.quizResults.find(
          (quiz) =>
            quiz.quizType
              .toUpperCase() ===
            'CORE'
        ) ?? null
      );
    }, [sitter]);

  const categoryQuizzes =
    useMemo(() => {
      return (
        sitter?.quizResults.filter(
          (quiz) =>
            quiz.quizType
              .toUpperCase() ===
            'CATEGORY'
        ) ?? []
      );
    }, [sitter]);

  /* =======================================================
   * APPROVE
   * ===================================================== */

  const handleApprove =
    async () => {
      if (
        !sitter ||
        !adminUserId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `ยืนยันการอนุมัติ ${getDisplayName(
            sitter
          )} เป็น Sitter หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError('');
        setMessage('');

        await AdminSitterService.approveSitter(
          sitter.sitterId,
          adminUserId
        );

        setMessage(
          'อนุมัติผู้สมัคร Sitter เรียบร้อยแล้ว'
        );

        setShowRejectBox(false);
        setRejectReason('');

        await loadData();
      } catch (err) {
        console.error(
          'APPROVE SITTER ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถอนุมัติผู้สมัครได้'
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
   * REJECT
   * ===================================================== */

  const handleReject =
    async () => {
      if (
        !sitter ||
        !adminUserId
      ) {
        return;
      }

      const reason =
        rejectReason.trim();

      if (!reason) {
        setError(
          'กรุณาระบุเหตุผลที่ไม่อนุมัติ'
        );
        return;
      }

      const confirmed =
        window.confirm(
          `ยืนยันการไม่อนุมัติ ${getDisplayName(
            sitter
          )} หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError('');
        setMessage('');

        await AdminSitterService.rejectSitter(
          sitter.sitterId,
          adminUserId,
          reason
        );

        setMessage(
          'บันทึกผลไม่อนุมัติเรียบร้อยแล้ว'
        );

        setShowRejectBox(false);
        setRejectReason('');

        await loadData();
      } catch (err) {
        console.error(
          'REJECT SITTER ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถปฏิเสธผู้สมัครได้'
        );
      } finally {
        setActionLoading(false);
      }
    };

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
              กำลังโหลดข้อมูลผู้สมัคร...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
   * NOT FOUND
   * ===================================================== */

  if (!sitter) {
    return (
      <main className="min-h-screen bg-[#FAF8FE] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/admin/sitters"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าผู้สมัคร
          </Link>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />

            <h1 className="mt-4 text-lg font-black text-slate-700">
              ไม่พบข้อมูลผู้สมัคร
            </h1>

            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  const normalizedStatus =
    normalizeStatus(
      sitter.verificationStatus
    );

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* BACK */}

        <Link
          href="/admin/sitters"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับรายชื่อผู้สมัคร
        </Link>

        {/* HEADER */}

        <section className="mt-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <UserRound className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xs font-bold text-purple-600">
                  Sitter Application
                </p>

                <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                  {getDisplayName(
                    sitter
                  )}
                </h1>

                <p className="mt-1 text-xs text-slate-400">
                  สมัครเมื่อ{' '}
                  {formatDate(
                    sitter.createdAt
                  )}
                </p>
              </div>
            </div>

            <StatusBadge
              status={
                sitter.verificationStatus
              }
            />
          </div>
        </section>

        {/* MESSAGES */}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* PROFILE */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <UserRound className="h-5 w-5" />
            }
            title="ข้อมูลผู้สมัคร"
            description="ข้อมูลบัญชีและสถานะผู้รับฝาก"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoBox
              label="ชื่อ"
              value={
                sitter.firstName ||
                '-'
              }
            />

            <InfoBox
              label="นามสกุล"
              value={
                sitter.lastName ||
                '-'
              }
            />

            <InfoBox
              label="ชื่อที่แสดง"
              value={
                sitter.displayName ||
                '-'
              }
            />

            <InfoBox
              label="สถานะยืนยันตัวตน"
              value={getStatusLabel(
                sitter.verificationStatus
              )}
            />

            <InfoBox
              label="Verified"
              value={
                sitter.isVerified
                  ? 'ใช่'
                  : 'ยัง'
              }
            />

            <InfoBox
              label="พร้อมรับงาน"
              value={
                sitter.isAvailable
                  ? 'เปิดรับงาน'
                  : 'ยังไม่เปิดรับงาน'
              }
            />
          </div>
        </section>

        {/* DOCUMENTS */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            title="หลักฐานยืนยันตัวตน"
            description="เอกสารจาก private storage สำหรับ Admin ตรวจสอบ"
          />

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <DocumentCard
              title="รูปบัตรประชาชน"
              imageUrl={
                sitter.identityDocumentSignedUrl
              }
            />

            <DocumentCard
              title="รูปถ่ายหน้าตรง"
              imageUrl={
                sitter.selfieSignedUrl
              }
            />
          </div>
        </section>

        {/* CORE QUIZ */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <FileCheck2 className="h-5 w-5" />
            }
            title="ผลแบบทดสอบพื้นฐาน"
            description="Core Quiz สำหรับผู้สมัคร Sitter"
          />

          <div className="mt-5">
            {coreQuiz ? (
              <QuizResultCard
                quiz={coreQuiz}
              />
            ) : (
              <EmptyBox text="ไม่พบผล Core Quiz ที่ผ่าน" />
            )}
          </div>
        </section>

        {/* CATEGORY */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <PawPrint className="h-5 w-5" />
            }
            title="ประเภทสัตว์ที่ผ่านการรับรอง"
            description="ประเภทสัตว์ที่ผู้สมัครสอบผ่านเกณฑ์"
          />

          {sitter.certifiedCategories
            .length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {sitter.certifiedCategories.map(
                (category) => (
                  <div
                    key={
                      category.categoryId
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                  >
                    <span className="text-xl">
                      {category.icon ||
                        '🐾'}
                    </span>

                    <div>
                      <p className="text-xs font-black text-emerald-800">
                        {
                          category.categoryName
                        }
                      </p>

                      <p className="mt-0.5 text-[10px] text-emerald-600">
                        CERTIFIED
                      </p>
                    </div>

                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyBox text="ยังไม่มีประเภทสัตว์ที่ผ่านการรับรอง" />
            </div>
          )}
        </section>

        {/* CATEGORY QUIZ */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <FileCheck2 className="h-5 w-5" />
            }
            title="ผลแบบทดสอบเฉพาะประเภท"
            description="แสดงผล Category Quiz ทุกประเภทที่ผู้สมัครทำผ่าน"
          />

          {categoryQuizzes.length >
          0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {categoryQuizzes.map(
                (quiz) => (
                  <QuizResultCard
                    key={`${quiz.quizSetId}-${quiz.categoryId ?? 'category'}`}
                    quiz={quiz}
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyBox text="ไม่พบผล Category Quiz ที่ผ่าน" />
            </div>
          )}
        </section>

        {/* ADMIN NOTE */}

        {sitter.adminNote && (
          <section className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5">
            <p className="text-xs font-bold text-red-700">
              หมายเหตุจากผู้ดูแลระบบ
            </p>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {sitter.adminNote}
            </p>
          </section>
        )}

        {/* ACTION */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            title="ผลการตรวจสอบ"
            description="อนุมัติหรือปฏิเสธสิทธิ์การเป็น Sitter"
          />

          {normalizedStatus ===
          'PENDING' ? (
            <>
              {showRejectBox && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <label className="text-xs font-bold text-red-800">
                    เหตุผลที่ไม่อนุมัติ
                  </label>

                  <textarea
                    value={
                      rejectReason
                    }
                    onChange={(event) =>
                      setRejectReason(
                        event.target
                          .value
                      )
                    }
                    rows={4}
                    placeholder="ระบุเหตุผล เช่น เอกสารไม่ชัดเจน หรือข้อมูลไม่ครบ..."
                    className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() => {
                        setShowRejectBox(
                          false
                        );
                        setRejectReason(
                          ''
                        );
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600"
                    >
                      ยกเลิก
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionLoading ||
                        !rejectReason.trim()
                      }
                      onClick={() =>
                        void handleReject()
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}

                      ยืนยันไม่อนุมัติ
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                {!showRejectBox && (
                  <button
                    type="button"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      setShowRejectBox(
                        true
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    <XCircle className="h-4 w-4" />
                    ไม่อนุมัติ
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    void handleApprove()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  อนุมัติ Sitter
                </button>
              </div>
            </>
          ) : normalizedStatus ===
            'APPROVED' ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />

              <div>
                <p className="text-sm font-black text-emerald-800">
                  ผู้สมัครได้รับการอนุมัติแล้ว
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  ตรวจสอบเมื่อ{' '}
                  {formatDate(
                    sitter.verifiedAt
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 text-red-600" />

              <div>
                <p className="text-sm font-black text-red-800">
                  ผู้สมัครไม่ได้รับการอนุมัติ
                </p>

                <p className="mt-1 text-xs text-red-700">
                  ตรวจสอบเมื่อ{' '}
                  {formatDate(
                    sitter.verifiedAt
                  )}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
 * COMPONENTS
 * ======================================================= */

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        {icon}
      </div>

      <div>
        <h2 className="text-sm font-black text-purple-950 sm:text-base">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          {description}
        </p>
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
    <div className="rounded-2xl border border-slate-100 bg-[#FAF8FE] px-4 py-3">
      <p className="text-[10px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function DocumentCard({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-[#FAF8FE]">
      <div className="border-b border-slate-100 bg-white px-4 py-3">
        <p className="text-xs font-black text-slate-700">
          {title}
        </p>
      </div>

      {imageUrl ? (
        <div className="relative min-h-70 bg-slate-50">
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            className="object-contain p-3"
          />
        </div>
      ) : (
        <div className="flex min-h-70 flex-col items-center justify-center p-6 text-center">
          <ImageIcon className="h-8 w-8 text-slate-300" />

          <p className="mt-2 text-xs text-slate-400">
            ไม่สามารถโหลดรูปได้
          </p>
        </div>
      )}
    </article>
  );
}

function QuizResultCard({
  quiz,
}: {
  quiz: AdminSitterQuizResult;
}) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-800">
            {quiz.titleTh}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {quiz.quizType}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          ผ่าน
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-3">
          <p className="text-[10px] font-bold text-slate-400">
            คะแนน
          </p>

          <p className="mt-1 text-xl font-black text-purple-700">
            {quiz.score}%
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-[10px] font-bold text-slate-400">
            ตอบถูก
          </p>

          <p className="mt-1 text-sm font-black text-slate-700">
            {quiz.correctAnswers}/
            {quiz.totalQuestions}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-400">
        ส่งเมื่อ{' '}
        {formatDate(
          quiz.submittedAt
        )}
      </p>
    </article>
  );
}

function EmptyBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
      {text}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeStatus(status);

  if (normalized === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        อนุมัติแล้ว
      </span>
    );
  }

  if (normalized === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
        <XCircle className="h-4 w-4" />
        ไม่อนุมัติ
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
      <Clock3 className="h-4 w-4" />
      รอการตรวจสอบ
    </span>
  );
}