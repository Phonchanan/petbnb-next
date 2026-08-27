'use client';

import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  PawPrint,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import {
  useEffect,
  useState,
} from 'react';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

interface CertifiedCategory {
  category_id: string;
  certification_status: string;

  pet_categories:
    | {
        id: string;
        name_th: string;
        icon: string | null;
      }
    | {
        id: string;
        name_th: string;
        icon: string | null;
      }[]
    | null;
}

export default function SitterOnboardingCompletePage() {
  const router = useRouter();

  const [certifiedCategories, setCertifiedCategories] =
    useState<CertifiedCategory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

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

        /*
         * หา sitter profile
         */
        const {
          data: sitterProfile,
          error: sitterError,
        } = await supabase
          .from('sitter_profiles')
          .select('id')
          .eq(
            'user_id',
            current.id
          )
          .maybeSingle();

        if (sitterError) {
          throw new Error(
            sitterError.message
          );
        }

        if (!sitterProfile) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        /*
         * ตรวจ Verification
         */
        const {
          data: verification,
          error: verificationError,
        } = await supabase
          .from(
            'sitter_verifications'
          )
          .select(
            'verification_status'
          )
          .eq(
            'sitter_id',
            sitterProfile.id
          )
          .maybeSingle();

        if (verificationError) {
          throw new Error(
            verificationError.message
          );
        }

        if (
          verification?.verification_status !==
          'APPROVED'
        ) {
          router.replace(
            '/sitter/onboarding/verification-status'
          );
          return;
        }

        /*
         * หา Core Quiz
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
         * ตรวจว่าผ่าน Core Quiz
         */
        const {
          data: coreAttempt,
          error: coreAttemptError,
        } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq(
            'sitter_id',
            sitterProfile.id
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

        if (!coreAttempt) {
          router.replace(
            '/sitter/onboarding/core-quiz'
          );
          return;
        }

        /*
         * โหลดกลุ่มที่ได้รับ Certified
         */
        const {
          data: categories,
          error: categoryError,
        } = await supabase
          .from(
            'sitter_categories'
          )
          .select(`
            category_id,
            certification_status,
            pet_categories (
              id,
              name_th,
              icon
            )
          `)
          .eq(
            'sitter_id',
            sitterProfile.id
          )
          .eq(
            'certification_status',
            'CERTIFIED'
          );

        if (categoryError) {
          throw new Error(
            categoryError.message
          );
        }

        const rows =
          (categories ??
            []) as CertifiedCategory[];

        /*
         * ต้องผ่านอย่างน้อย 1 กลุ่ม
         */
        if (rows.length === 0) {
          router.replace(
            '/sitter/onboarding/categories'
          );
          return;
        }

        setCertifiedCategories(
          rows
        );
      } catch (err) {
        console.error(
          'LOAD ONBOARDING COMPLETE ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถตรวจสอบสถานะการสมัครได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const getCategory = (
    item: CertifiedCategory
  ) => {
    if (
      Array.isArray(
        item.pet_categories
      )
    ) {
      return (
        item.pet_categories[0] ??
        null
      );
    }

    return (
      item.pet_categories ??
      null
    );
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังตรวจสอบขั้นตอนการสมัคร...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section className="rounded-4xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-4xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-11 w-11" />
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Onboarding Complete
        </div>

        <h1 className="mt-4 text-2xl font-black text-[#2E1065] sm:text-3xl">
          ผ่านขั้นตอนการสมัครผู้รับฝากแล้ว 🎉
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          คุณผ่านการยืนยันตัวตน
          แบบทดสอบพื้นฐาน
          และได้รับการรับรองอย่างน้อยหนึ่งกลุ่มสัตว์แล้ว
          ขั้นตอนต่อไปคือสร้างโปรไฟล์ผู้รับฝาก
        </p>
      </section>

      {/* CERTIFIED CATEGORIES */}
      <section className="mt-6 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <PawPrint className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-black text-purple-950">
              ป้ายรับรองของคุณ
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              กลุ่มสัตว์ที่คุณผ่าน Category Quiz แล้ว
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {certifiedCategories.map(
            (item) => {
              const category =
                getCategory(item);

              return (
                <article
                  key={
                    item.category_id
                  }
                  className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                    {category?.icon ||
                      '🐾'}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-black text-purple-950">
                      {category?.name_th ||
                        item.category_id}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Certified Pet Sitter
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              '/sitter/onboarding/categories'
            )
          }
          className="mt-5 text-xs font-bold text-purple-600 hover:text-purple-700"
        >
          + รับรองกลุ่มสัตว์เพิ่มเติม
        </button>
      </section>

      {/* NEXT STEP */}
      <section className="mt-6 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-purple-950">
                ขั้นตอนสุดท้าย
              </h2>

              <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                กรอกข้อมูลโปรไฟล์ผู้รับฝาก
                เช่น พื้นที่ให้บริการในสุราษฎร์ธานี
                ประเภทที่พัก ประสบการณ์
                ราคาเริ่มต้น และข้อมูลแนะนำตัว
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
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
          >
            สร้างโปรไฟล์ผู้รับฝาก

            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}