'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

interface CareGuideline {
  id: string;
  category_id: string;
  title_th: string;
  content_th: string;
  version: string;
}

interface PetCategory {
  id: string;
  name_th: string;
  description_th: string | null;
  icon: string | null;
}

export default function SitterGuidelinePage() {
  const router = useRouter();
  const params = useParams();

  const categoryId =
    typeof params.categoryId === 'string'
      ? params.categoryId
      : '';

  const [sitterProfileId, setSitterProfileId] =
    useState('');

  const [category, setCategory] =
    useState<PetCategory | null>(null);

  const [guideline, setGuideline] =
    useState<CareGuideline | null>(null);

  const [accepted, setAccepted] =
    useState(false);

  const [alreadyAccepted, setAlreadyAccepted] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!categoryId) {
          throw new Error(
            'ไม่พบรหัสประเภทสัตว์'
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
          'SITTER'
        ) {
          router.replace('/');
          return;
        }

        // 1. หา Sitter
        const {
          data: sitter,
          error: sitterError,
        } = await supabase
          .from('sitter_profiles')
          .select('id')
          .eq('user_id', current.id)
          .maybeSingle();

        if (sitterError) {
          throw new Error(
            sitterError.message
          );
        }

        if (!sitter) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        setSitterProfileId(
          sitter.id
        );

        // 2. ตรวจเอกสาร
        // ไม่ต้องรอ Admin APPROVED
        const {
          data: verification,
          error: verificationError,
        } = await supabase
          .from('sitter_verifications')
          .select(`
            verification_status,
            identity_document_url,
            selfie_url
          `)
          .eq(
            'sitter_id',
            sitter.id
          )
          .maybeSingle();

        if (verificationError) {
          throw new Error(
            verificationError.message
          );
        }

        if (
          !verification ||
          !verification.identity_document_url ||
          !verification.selfie_url
        ) {
          router.replace(
            '/sitter/onboarding/verification'
          );
          return;
        }

        if (
          verification.verification_status ===
          'REJECTED'
        ) {
          router.replace(
            '/sitter/onboarding/verification-status'
          );
          return;
        }

        // 3. ตรวจ Core Quiz
        const {
          data: coreQuiz,
          error: coreQuizError,
        } = await supabase
          .from('quiz_sets')
          .select('id')
          .eq('quiz_type', 'CORE')
          .eq('is_active', true)
          .order('created_at', {
            ascending: true,
          })
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

        const {
          data: passedCore,
          error: coreAttemptError,
        } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq(
            'sitter_id',
            sitter.id
          )
          .eq(
            'quiz_set_id',
            coreQuiz.id
          )
          .eq('passed', true)
          .limit(1)
          .maybeSingle();

        if (coreAttemptError) {
          throw new Error(
            coreAttemptError.message
          );
        }

        if (!passedCore) {
          router.replace(
            '/sitter/onboarding/core-quiz'
          );
          return;
        }

        // 4. โหลดประเภทสัตว์
        const {
          data: categoryData,
          error: categoryError,
        } = await supabase
          .from('pet_categories')
          .select(`
            id,
            name_th,
            description_th,
            icon
          `)
          .eq('id', categoryId)
          .eq('is_active', true)
          .maybeSingle();

        if (categoryError) {
          throw new Error(
            categoryError.message
          );
        }

        if (!categoryData) {
          throw new Error(
            'ไม่พบประเภทสัตว์ที่เลือก'
          );
        }

        setCategory(
          categoryData as PetCategory
        );

        // 5. โหลด Care Guideline
        const {
          data: guidelineData,
          error: guidelineError,
        } = await supabase
          .from('care_guidelines')
          .select(`
            id,
            category_id,
            title_th,
            content_th,
            version
          `)
          .eq(
            'category_id',
            categoryId
          )
          .eq('is_active', true)
          .order('created_at', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (guidelineError) {
          throw new Error(
            guidelineError.message
          );
        }

        if (!guidelineData) {
          throw new Error(
            'ยังไม่มีคู่มือการดูแลสำหรับประเภทสัตว์นี้'
          );
        }

        setGuideline(
          guidelineData as CareGuideline
        );

        // 6. ตรวจว่าเคยยอมรับแล้วหรือไม่
        const {
          data: acceptance,
          error: acceptanceError,
        } = await supabase
          .from(
            'sitter_guideline_acceptances'
          )
          .select(`
            id,
            accepted_at
          `)
          .eq(
            'sitter_id',
            sitter.id
          )
          .eq(
            'guideline_id',
            guidelineData.id
          )
          .maybeSingle();

        if (acceptanceError) {
          throw new Error(
            acceptanceError.message
          );
        }

        if (acceptance) {
          setAccepted(true);
          setAlreadyAccepted(true);
        }
      } catch (err) {
        console.error(
          'LOAD GUIDELINE ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดคู่มือได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    categoryId,
    router,
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !accepted ||
      !guideline ||
      !category ||
      !sitterProfileId
    ) {
      setError(
        'กรุณายืนยันว่าคุณได้อ่านและเข้าใจคู่มือแล้ว'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (!alreadyAccepted) {
        const {
          error: insertError,
        } = await supabase
          .from(
            'sitter_guideline_acceptances'
          )
          .insert({
            sitter_id:
              sitterProfileId,

            category_id:
              category.id,

            guideline_id:
              guideline.id,

            accepted_at:
              new Date().toISOString(),
          });

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }
      }

      router.push(
        `/sitter/onboarding/category-quiz/${category.id}`
      );
    } catch (err) {
      console.error(
        'ACCEPT GUIDELINE ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถบันทึกการยอมรับคู่มือได้'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดคู่มือ...
          </p>
        </div>
      </main>
    );
  }

  if (
    !guideline ||
    !category
  ) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error ||
            'ไม่พบคู่มือ'}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              '/sitter/onboarding/categories'
            )
          }
          className="mt-4 rounded-2xl bg-purple-600 px-5 py-3 text-xs font-bold text-white"
        >
          กลับไปเลือกประเภทสัตว์
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* HEADER */}
      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-2xl">
            {category.icon ||
              '🐾'}
          </div>

          <div>
            <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              แนวทางการดูแล
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              {category.name_th}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              อ่านแนวทางให้ครบก่อนเข้าสู่แบบทดสอบเฉพาะประเภทสัตว์
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* GUIDELINE */}
      <section className="mt-6 overflow-hidden rounded-[30px] border border-purple-100 bg-white shadow-sm">
        <div className="border-b border-purple-100 bg-purple-50/50 p-6">
          <div className="flex items-center gap-3">
            <BookOpenCheck className="h-6 w-6 text-purple-600" />

            <div>
              <h2 className="font-black text-purple-950">
                {guideline.title_th}
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                เวอร์ชัน{' '}
                {guideline.version}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="whitespace-pre-line text-sm leading-8 text-slate-600">
            {guideline.content_th}
          </div>
        </div>
      </section>

      {/* INFO */}
      <section className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-purple-600" />

          <p className="text-xs leading-5 text-slate-600">
            หลังจากอ่านคู่มือแล้ว
            คุณจะต้องทำแบบทดสอบเฉพาะประเภทสัตว์
            และต้องได้คะแนนอย่างน้อย
            <strong className="text-purple-700">
              {' '}80%
            </strong>
          </p>
        </div>
      </section>

      {/* ACCEPT */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6"
      >
        <label
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            alreadyAccepted
              ? 'border-emerald-200 bg-emerald-50'
              : 'cursor-pointer border-purple-100 bg-[#FAF8FE]'
          }`}
        >
          <input
            type="checkbox"
            checked={accepted}
            disabled={
              alreadyAccepted
            }
            onChange={(event) =>
              setAccepted(
                event.target.checked
              )
            }
            className="mt-1 accent-purple-600"
          />

          <div className="flex-1">
            <p className="text-sm font-bold text-purple-950">
              ฉันได้อ่านและเข้าใจแนวทางการดูแลแล้ว
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              ฉันยืนยันว่าได้อ่านข้อมูลก่อนเข้าสู่แบบทดสอบ
            </p>
          </div>

          {alreadyAccepted && (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          )}
        </label>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() =>
              router.push(
                '/sitter/onboarding/categories'
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 px-5 py-3 text-xs font-bold text-purple-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </button>

          <button
            type="submit"
            disabled={
              !accepted ||
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                ไปทำแบบทดสอบ
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}