'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
  PawPrint,
  ShieldCheck,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

interface PetCategory {
  id: string;
  name_th: string;
  description_th: string | null;
  icon: string | null;
  display_order: number;
}

interface SitterCategory {
  category_id: string;
  certification_status?: string | null;
}

const MAX_SELECTION = 2;

export default function SitterCategorySelectionPage() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<PetCategory[]>([]);

  const [sitterCategories, setSitterCategories] =
    useState<SitterCategory[]>([]);

  /*
   * เก็บ category ที่ผู้ใช้เลือก
   */
  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState<string[]>([]);

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
          router.replace('/');
          return;
        }

        /*
         * 1. หา Sitter Profile
         */
        const {
          data: sitter,
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

        if (!sitter) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        /*
         * 2. ตรวจเอกสาร
         */
        const {
          data: verification,
          error: verificationError,
        } = await supabase
          .from(
            'sitter_verifications'
          )
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

        /*
         * ถ้าถูกปฏิเสธ
         */
        if (
          verification.verification_status ===
          'REJECTED'
        ) {
          router.replace(
            '/sitter/onboarding/verification-status'
          );
          return;
        }

        /*
         * 3. หา Core Quiz
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
         * 4. ต้องผ่าน Core Quiz
         */
        const {
          data: passedAttempt,
          error: attemptError,
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
          .eq(
            'passed',
            true
          )
          .limit(1)
          .maybeSingle();

        if (attemptError) {
          throw new Error(
            attemptError.message
          );
        }

        if (!passedAttempt) {
          router.replace(
            '/sitter/onboarding/core-quiz'
          );
          return;
        }

        /*
         * 5. โหลดประเภทสัตว์
         */
        const {
          data: categoryData,
          error: categoryError,
        } = await supabase
          .from('pet_categories')
          .select(`
            id,
            name_th,
            description_th,
            icon,
            display_order
          `)
          .eq(
            'is_active',
            true
          )
          .order(
            'display_order',
            {
              ascending: true,
            }
          );

        if (categoryError) {
          throw new Error(
            categoryError.message
          );
        }

        setCategories(
          (categoryData ??
            []) as PetCategory[]
        );

        /*
         * 6. โหลดประเภทที่เคยสอบผ่าน
         */
        const {
          data: sitterCategoryData,
          error: sitterCategoryError,
        } = await supabase
          .from(
            'sitter_categories'
          )
          .select(`
            category_id,
            certification_status
          `)
          .eq(
            'sitter_id',
            sitter.id
          );

        if (sitterCategoryError) {
          throw new Error(
            sitterCategoryError.message
          );
        }

        const rows =
          (sitterCategoryData ??
            []) as SitterCategory[];

        setSitterCategories(
          rows
        );

        /*
         * ถ้ามีประเภทที่ผ่านแล้ว
         * ให้เลือกประเภทเหล่านั้นไว้โดยอัตโนมัติ
         *
         * สูงสุด 2 ประเภท
         */
        const certifiedIds =
          rows
            .filter(
              (item) =>
                item.certification_status ===
                'CERTIFIED'
            )
            .map(
              (item) =>
                item.category_id
            )
            .slice(
              0,
              MAX_SELECTION
            );

        setSelectedCategoryIds(
          certifiedIds
        );
      } catch (err) {
        console.error(
          'LOAD CATEGORIES ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดประเภทสัตว์ได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  /*
   * จำนวนประเภทที่สอบผ่าน
   */
  const certifiedCount =
    useMemo(
      () =>
        sitterCategories.filter(
          (item) =>
            item.certification_status ===
            'CERTIFIED'
        ).length,
      [sitterCategories]
    );

  /*
   * ตรวจว่า category นี้ผ่านแล้วหรือยัง
   */
  const isCertified = (
    categoryId: string
  ) => {
    return sitterCategories.some(
      (item) =>
        item.category_id ===
          categoryId &&
        item.certification_status ===
          'CERTIFIED'
    );
  };

  /*
   * ตรวจว่า category นี้ถูกเลือกหรือไม่
   */
  const isSelected = (
    categoryId: string
  ) => {
    return selectedCategoryIds.includes(
      categoryId
    );
  };

  /*
   * เลือก / ยกเลิก
   */
  const toggleCategory = (
    categoryId: string
  ) => {
    setError('');

    /*
     * ถ้าเลือกอยู่แล้ว
     * -> ยกเลิก
     */
    if (
      selectedCategoryIds.includes(
        categoryId
      )
    ) {
      setSelectedCategoryIds(
        (previous) =>
          previous.filter(
            (id) =>
              id !==
              categoryId
          )
      );

      return;
    }

    /*
     * เลือกครบ 2 แล้ว
     */
    if (
      selectedCategoryIds.length >=
      MAX_SELECTION
    ) {
      setError(
        'สามารถเลือกประเภทสัตว์ได้สูงสุด 2 ประเภท'
      );

      return;
    }

    /*
     * เพิ่ม category
     */
    setSelectedCategoryIds(
      (previous) => [
        ...previous,
        categoryId,
      ]
    );
  };

  /*
   * ดำเนินการต่อ
   */
  const handleContinue = () => {
    if (
      selectedCategoryIds.length ===
      0
    ) {
      setError(
        'กรุณาเลือกประเภทสัตว์อย่างน้อย 1 ประเภท'
      );

      return;
    }

    /*
     * เก็บรายการที่เลือกไว้ชั่วคราว
     *
     * เช่น
     * [
     *   "CANINE_FELINE",
     *   "SMALL_MAMMALS"
     * ]
     */
    sessionStorage.setItem(
      'sitter_selected_categories',
      JSON.stringify(
        selectedCategoryIds
      )
    );

    /*
     * หา category แรกที่ยังไม่ Certified
     */
    const firstPending =
      selectedCategoryIds.find(
        (id) =>
          !isCertified(id)
      );

    /*
     * ถ้าทุกประเภทผ่านแล้ว
     * ไปสถานะการสมัคร
     */
    if (!firstPending) {
      router.push(
        '/sitter/onboarding/verification-status'
      );

      return;
    }

    /*
     * เริ่ม Guideline ของประเภทแรก
     */
    router.push(
      `/sitter/onboarding/guideline/${firstPending}`
    );
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดประเภทสัตว์...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* HEADER */}
      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <PawPrint className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              เลือกประเภทสัตว์
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              คุณต้องการเปิดรับฝากสัตว์ประเภทใด?
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              เลือกประเภทสัตว์ที่คุณมีความพร้อมในการดูแล
              สามารถเลือกได้สูงสุด 2 ประเภท
              และต้องผ่านแบบทดสอบเฉพาะของแต่ละประเภทอย่างน้อย 80%
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />

                ผ่านแบบทดสอบพื้นฐานแล้ว
              </div>

              <div className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1.5 text-[11px] font-bold text-purple-700">
                เลือกแล้ว{' '}
                {selectedCategoryIds.length}
                /2 ประเภท
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* PASSED */}
      {certifiedCount > 0 && (
        <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />

            ผ่านแบบทดสอบแล้ว{' '}
            {certifiedCount}{' '}
            ประเภท
          </div>
        </section>
      )}

      {/* CATEGORY GRID */}
      <section className="mt-6 grid gap-5 md:grid-cols-2">
        {categories.map(
          (category) => {
            const selected =
              isSelected(
                category.id
              );

            const certified =
              isCertified(
                category.id
              );

            const limitReached =
              selectedCategoryIds.length >=
                MAX_SELECTION &&
              !selected;

            return (
              <button
                key={category.id}
                type="button"
                disabled={
                  limitReached
                }
                onClick={() =>
                  toggleCategory(
                    category.id
                  )
                }
                className={`relative rounded-[28px] border p-6 text-left shadow-sm transition ${
                  selected
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                    : limitReached
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-50'
                      : 'border-purple-100 bg-white hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {/* SELECT CHECK */}
                <div
                  className={`absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full border ${
                    selected
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-purple-200 bg-white'
                  }`}
                >
                  {selected && (
                    <Check className="h-4 w-4" />
                  )}
                </div>

                <div className="flex items-start gap-4 pr-10">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-purple-100 text-2xl">
                    {category.icon ||
                      '🐾'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-purple-950">
                        {
                          category.name_th
                        }
                      </h2>

                      {certified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />

                          ผ่านแล้ว
                        </span>
                      )}
                    </div>

                    {category.description_th && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {
                          category.description_th
                        }
                      </p>
                    )}

                    <p
                      className={`mt-4 text-xs font-bold ${
                        selected
                          ? 'text-purple-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {selected
                        ? 'เลือกประเภทนี้แล้ว'
                        : 'คลิกเพื่อเลือก'}
                    </p>
                  </div>
                </div>
              </button>
            );
          }
        )}
      </section>

      {/* SELECTION SUMMARY */}
      {selectedCategoryIds.length >
        0 && (
        <section className="mt-6 rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-purple-950">
            ประเภทสัตว์ที่เลือก
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategoryIds.map(
              (categoryId) => {
                const category =
                  categories.find(
                    (item) =>
                      item.id ===
                      categoryId
                  );

                if (!category) {
                  return null;
                }

                return (
                  <div
                    key={
                      category.id
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700"
                  >
                    <span>
                      {category.icon ||
                        '🐾'}
                    </span>

                    <span>
                      {
                        category.name_th
                      }
                    </span>

                    {isCertified(
                      category.id
                    ) && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* CONTINUE */}
      <div className="sticky bottom-4 mt-6 rounded-3xl border border-purple-100 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-purple-950">
              เลือกได้สูงสุด 2 ประเภท
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              เลือกแล้ว{' '}
              {selectedCategoryIds.length}
              /2 ประเภท
            </p>
          </div>

          <button
            type="button"
            disabled={
              selectedCategoryIds.length ===
              0
            }
            onClick={
              handleContinue
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ดำเนินการต่อ

            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}