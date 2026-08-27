/* eslint-disable react-hooks/immutability */
'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

interface QuizChoice {
  id: string;
  choice_text_th: string;
  is_correct: boolean;
  display_order: number;
}

interface QuizQuestion {
  id: string;
  question_text_th: string;
  explanation_th: string | null;
  display_order: number;
  choices: QuizChoice[];
}

interface QuizSet {
  id: string;
  title_th: string;
  description_th: string | null;
  passing_score: number;
  category_id: string;
}

interface PetCategory {
  id: string;
  name_th: string;
  icon: string | null;
}

interface QuizResult {
  attemptId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
}

export default function CategoryQuizPage() {
  const router = useRouter();
  const params = useParams();

  const categoryId =
    typeof params.categoryId === 'string'
      ? params.categoryId
      : '';

  const [sitterProfileId, setSitterProfileId] =
    useState('');

  const [verificationId, setVerificationId] =
    useState('');

  const [category, setCategory] =
    useState<PetCategory | null>(null);

  const [quizSet, setQuizSet] =
    useState<QuizSet | null>(null);

  const [questions, setQuestions] =
    useState<QuizQuestion[]>([]);

  const [answers, setAnswers] =
    useState<Record<string, string>>({});

  const [nextCategoryId, setNextCategoryId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  const [result, setResult] =
    useState<QuizResult | null>(null);

  /*
   * โหลด Quiz
   */
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError('');
        setNextCategoryId(null);

        if (!categoryId) {
          throw new Error(
            'ไม่พบรหัสประเภทสัตว์'
          );
        }

        /*
         * 1. ตรวจ Login
         */
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
         * 2. หา sitter profile
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

        setSitterProfileId(
          sitterProfile.id
        );

        /*
         * 3. ตรวจ Verification
         *
         * ยังไม่ต้อง APPROVED
         * แค่ต้องส่งเอกสารครบ
         */
        const {
          data: verification,
          error: verificationError,
        } = await supabase
          .from('sitter_verifications')
          .select(`
            id,
            verification_status,
            identity_document_url,
            selfie_url
          `)
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

        if (!verification) {
          router.replace(
            '/sitter/onboarding/verification'
          );
          return;
        }

        setVerificationId(
          verification.id
        );

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
         * ถ้า Admin ปฏิเสธแล้ว
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
         * 4. ต้องผ่าน Core Quiz
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
         * 5. โหลด Category
         */
        const {
          data: categoryData,
          error: categoryError,
        } = await supabase
          .from('pet_categories')
          .select(`
            id,
            name_th,
            icon
          `)
          .eq(
            'id',
            categoryId
          )
          .eq(
            'is_active',
            true
          )
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

        /*
         * 6. ต้องอ่าน Guideline ก่อน
         */
        const {
          data: guideline,
          error: guidelineError,
        } = await supabase
          .from('care_guidelines')
          .select('id')
          .eq(
            'category_id',
            categoryId
          )
          .eq(
            'is_active',
            true
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

        if (guidelineError) {
          throw new Error(
            guidelineError.message
          );
        }

        if (!guideline) {
          router.replace(
            `/sitter/onboarding/guideline/${categoryId}`
          );
          return;
        }

        const {
          data: acceptance,
          error: acceptanceError,
        } = await supabase
          .from(
            'sitter_guideline_acceptances'
          )
          .select('id')
          .eq(
            'sitter_id',
            sitterProfile.id
          )
          .eq(
            'guideline_id',
            guideline.id
          )
          .maybeSingle();

        if (acceptanceError) {
          throw new Error(
            acceptanceError.message
          );
        }

        if (!acceptance) {
          router.replace(
            `/sitter/onboarding/guideline/${categoryId}`
          );
          return;
        }

        /*
         * 7. โหลด Category Quiz
         */
        const {
          data: categoryQuiz,
          error: quizError,
        } = await supabase
          .from('quiz_sets')
          .select(`
            id,
            title_th,
            description_th,
            passing_score,
            category_id
          `)
          .eq(
            'quiz_type',
            'CATEGORY'
          )
          .eq(
            'category_id',
            categoryId
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

        if (quizError) {
          throw new Error(
            quizError.message
          );
        }

        if (!categoryQuiz) {
          throw new Error(
            'ยังไม่มีแบบทดสอบสำหรับประเภทสัตว์นี้'
          );
        }

        setQuizSet(
          categoryQuiz as QuizSet
        );

        /*
         * 8. โหลดคำถาม
         */
        const {
          data: questionData,
          error: questionError,
        } = await supabase
          .from('quiz_questions')
          .select(`
            id,
            question_text_th,
            explanation_th,
            display_order
          `)
          .eq(
            'quiz_set_id',
            categoryQuiz.id
          )
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

        if (questionError) {
          throw new Error(
            questionError.message
          );
        }

        const questionRows =
          questionData ?? [];

        if (
          questionRows.length === 0
        ) {
          throw new Error(
            'แบบทดสอบนี้ยังไม่มีคำถาม'
          );
        }

        const questionIds =
          questionRows.map(
            (question) =>
              question.id
          );

        /*
         * 9. โหลด Choices
         */
        const {
          data: choiceData,
          error: choiceError,
        } = await supabase
          .from('quiz_choices')
          .select(`
            id,
            question_id,
            choice_text_th,
            is_correct,
            display_order
          `)
          .in(
            'question_id',
            questionIds
          )
          .order(
            'display_order',
            {
              ascending: true,
            }
          );

        if (choiceError) {
          throw new Error(
            choiceError.message
          );
        }

        const choices =
          choiceData ?? [];

        const mappedQuestions:
          QuizQuestion[] =
          questionRows.map(
            (question) => ({
              id:
                question.id,

              question_text_th:
                question.question_text_th,

              explanation_th:
                question.explanation_th,

              display_order:
                question.display_order,

              choices:
                choices
                  .filter(
                    (choice) =>
                      choice.question_id ===
                      question.id
                  )
                  .map(
                    (choice) => ({
                      id:
                        choice.id,

                      choice_text_th:
                        choice.choice_text_th,

                      is_correct:
                        choice.is_correct,

                      display_order:
                        choice.display_order,
                    })
                  ),
            })
          );

        setQuestions(
          mappedQuestions
        );

        /*
         * 10. เช็กว่าเคย CERTIFIED แล้วหรือยัง
         */
        const {
          data: certification,
          error: certificationError,
        } = await supabase
          .from('sitter_categories')
          .select(`
            category_id,
            certification_status,
            quiz_attempt_id
          `)
          .eq(
            'sitter_id',
            sitterProfile.id
          )
          .eq(
            'category_id',
            categoryId
          )
          .maybeSingle();

        if (certificationError) {
          throw new Error(
            certificationError.message
          );
        }

        /*
         * ถ้าเคยผ่านแล้ว
         * โหลดผลเดิมมาแสดง
         */
        if (
          certification?.certification_status ===
            'CERTIFIED' &&
          certification.quiz_attempt_id
        ) {
          const {
            data: attempt,
            error: attemptError,
          } = await supabase
            .from('quiz_attempts')
            .select(`
              id,
              total_questions,
              correct_answers,
              score,
              passed
            `)
            .eq(
              'id',
              certification.quiz_attempt_id
            )
            .maybeSingle();

          if (attemptError) {
            throw new Error(
              attemptError.message
            );
          }

          if (attempt) {
            setResult({
              attemptId:
                attempt.id,

              totalQuestions:
                attempt.total_questions,

              correctAnswers:
                attempt.correct_answers,

              score:
                Number(
                  attempt.score
                ),

              passed:
                attempt.passed,
            });

            /*
             * ถ้าเข้าหน้าประเภทที่เคยผ่าน
             * ให้หา category ถัดไปด้วย
             */
            const selectedCategories =
              getSelectedCategories();

            const nextId =
              findNextCategoryId(
                selectedCategories,
                categoryId
              );

            if (nextId) {
              setNextCategoryId(
                nextId
              );
            }
          }
        }
      } catch (err) {
        console.error(
          'LOAD CATEGORY QUIZ ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดแบบทดสอบได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [
    categoryId,
    router,
  ]);

  /*
   * อ่าน Category ที่เลือกจาก sessionStorage
   */
  const getSelectedCategories =
    (): string[] => {
      if (
        typeof window ===
        'undefined'
      ) {
        return [];
      }

      const stored =
        sessionStorage.getItem(
          'sitter_selected_categories'
        );

      if (!stored) {
        return [];
      }

      try {
        const parsed =
          JSON.parse(stored);

        if (
          Array.isArray(parsed)
        ) {
          return parsed.filter(
            (item) =>
              typeof item ===
              'string'
          );
        }

        return [];
      } catch {
        return [];
      }
    };

  /*
   * หา category ตัวถัดไปตามลำดับที่เลือก
   */
  const findNextCategoryId = (
    selectedCategories: string[],
    currentCategoryId: string
  ): string | null => {
    const currentIndex =
      selectedCategories.indexOf(
        currentCategoryId
      );

    if (
      currentIndex < 0
    ) {
      return null;
    }

    const next =
      selectedCategories[
        currentIndex + 1
      ];

    return next || null;
  };

  const answeredCount =
    useMemo(
      () =>
        Object.keys(
          answers
        ).length,
      [answers]
    );

  const allAnswered =
    questions.length > 0 &&
    answeredCount ===
      questions.length;

  /*
   * เลือกคำตอบ
   */
  const handleSelect = (
    questionId: string,
    choiceId: string
  ) => {
    if (result) {
      return;
    }

    setAnswers(
      (previous) => ({
        ...previous,
        [questionId]:
          choiceId,
      })
    );
  };

  /*
   * Submit Quiz
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !quizSet ||
      !category ||
      !sitterProfileId ||
      !verificationId
    ) {
      return;
    }

    if (!allAnswered) {
      setError(
        `กรุณาตอบคำถามให้ครบทุกข้อ (${answeredCount}/${questions.length})`
      );

      return;
    }

    try {
      setSubmitting(true);
      setError('');

      /*
       * คำนวณคะแนน
       */
      let correctAnswers = 0;

      for (
        const question of
        questions
      ) {
        const selectedChoiceId =
          answers[
            question.id
          ];

        const selectedChoice =
          question.choices.find(
            (choice) =>
              choice.id ===
              selectedChoiceId
          );

        if (
          selectedChoice?.is_correct
        ) {
          correctAnswers += 1;
        }
      }

      const totalQuestions =
        questions.length;

      const score =
        totalQuestions > 0
          ? Number(
              (
                (correctAnswers /
                  totalQuestions) *
                100
              ).toFixed(2)
            )
          : 0;

      const passed =
        score >=
        quizSet.passing_score;

      const now =
        new Date().toISOString();

      /*
       * 1. บันทึก Quiz Attempt
       */
      const {
        data: attempt,
        error: attemptError,
      } = await supabase
        .from('quiz_attempts')
        .insert({
          sitter_id:
            sitterProfileId,

          quiz_set_id:
            quizSet.id,

          total_questions:
            totalQuestions,

          correct_answers:
            correctAnswers,

          score,

          passed,

          started_at:
            now,

          submitted_at:
            now,
        })
        .select('id')
        .single();

      if (attemptError) {
        throw new Error(
          attemptError.message
        );
      }

      /*
       * ถ้าไม่ผ่าน
       * แค่แสดงผลแล้วให้ทำใหม่
       */
      if (!passed) {
        setResult({
          attemptId:
            attempt.id,

          totalQuestions,

          correctAnswers,

          score,

          passed: false,
        });

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });

        return;
      }

      /*
       * 2. ผ่านแล้ว
       * บันทึก CERTIFIED
       */
      const {
        data: existingCategory,
        error:
          existingCategoryError,
      } = await supabase
        .from('sitter_categories')
        .select(`
          sitter_id,
          category_id
        `)
        .eq(
          'sitter_id',
          sitterProfileId
        )
        .eq(
          'category_id',
          category.id
        )
        .maybeSingle();

      if (
        existingCategoryError
      ) {
        throw new Error(
          existingCategoryError.message
        );
      }

      /*
       * มี row เดิม
       */
      if (existingCategory) {
        const {
          error: updateCategoryError,
        } = await supabase
          .from('sitter_categories')
          .update({
            certification_status:
              'CERTIFIED',

            certified_at:
              now,

            quiz_attempt_id:
              attempt.id,
          })
          .eq(
            'sitter_id',
            sitterProfileId
          )
          .eq(
            'category_id',
            category.id
          );

        if (
          updateCategoryError
        ) {
          throw new Error(
            updateCategoryError.message
          );
        }
      } else {
        /*
         * ยังไม่มี row
         */
        const {
          error: insertCategoryError,
        } = await supabase
          .from('sitter_categories')
          .insert({
            sitter_id:
              sitterProfileId,

            category_id:
              category.id,

            certification_status:
              'CERTIFIED',

            certified_at:
              now,

            quiz_attempt_id:
              attempt.id,
          });

        if (
          insertCategoryError
        ) {
          throw new Error(
            insertCategoryError.message
          );
        }
      }

      /*
       * 3. ดูว่าผู้สมัครเลือกกี่ประเภท
       */
      const selectedCategories =
        getSelectedCategories();

      /*
       * หา category ถัดไป
       */
      const nextId =
        findNextCategoryId(
          selectedCategories,
          category.id
        );

      /*
       * ยังมีประเภทที่ 2
       *
       * สำคัญ:
       * ยังไม่เปลี่ยนเป็น PENDING_APPROVAL
       */
      if (nextId) {
        setNextCategoryId(
          nextId
        );

        setResult({
          attemptId:
            attempt.id,

          totalQuestions,

          correctAnswers,

          score,

          passed: true,
        });

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });

        return;
      }

      /*
       * 4. ไม่มีประเภทถัดไปแล้ว
       *
       * แปลว่าทำครบทุก Category ที่เลือกแล้ว
       * จึงเปลี่ยนเป็น PENDING_APPROVAL
       */
      const {
        error:
          verificationUpdateError,
      } = await supabase
        .from('sitter_verifications')
        .update({
          verification_status:
            'PENDING_APPROVAL',

          admin_note:
            null,

          verified_by:
            null,

          verified_at:
            null,

          updated_at:
            now,
        })
        .eq(
          'id',
          verificationId
        )
        .eq(
          'sitter_id',
          sitterProfileId
        );

      if (
        verificationUpdateError
      ) {
        throw new Error(
          verificationUpdateError.message
        );
      }

      /*
       * sitter_profiles
       * ยังคง PENDING จนกว่า Admin จะอนุมัติ
       */
      const {
        error:
          sitterStatusError,
      } = await supabase
        .from('sitter_profiles')
        .update({
          verification_status:
            'PENDING',

          is_verified:
            false,

          is_available:
            false,

          updated_at:
            now,
        })
        .eq(
          'id',
          sitterProfileId
        );

      if (
        sitterStatusError
      ) {
        throw new Error(
          sitterStatusError.message
        );
      }

      setNextCategoryId(null);

      setResult({
        attemptId:
          attempt.id,

        totalQuestions,

        correctAnswers,

        score,

        passed: true,
      });

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error(
        'SUBMIT CATEGORY QUIZ ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถบันทึกผลแบบทดสอบได้'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ทำใหม่
   */
  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError('');
    setNextCategoryId(null);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /*
   * ไปประเภทถัดไป
   */
  const handleNextCategory =
    () => {
      if (!nextCategoryId) {
        return;
      }

      router.push(
        `/sitter/onboarding/guideline/${nextCategoryId}`
      );
    };

  /*
   * ไปหน้า Status
   */
  const handleFinish =
    () => {
      sessionStorage.removeItem(
        'sitter_selected_categories'
      );

      router.push(
        '/sitter/onboarding/verification-status'
      );
    };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดแบบทดสอบ...
          </p>
        </div>
      </main>
    );
  }

  if (
    !quizSet ||
    !category
  ) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error ||
            'ไม่พบแบบทดสอบ'}
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

          <div className="flex-1">
            <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              แบบทดสอบเฉพาะประเภทสัตว์
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              {quizSet.title_th}
            </h1>

            <p className="mt-1 text-sm font-bold text-purple-700">
              {category.name_th}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {quizSet.description_th ||
                'เลือกคำตอบที่ถูกต้องที่สุดเพียง 1 ข้อต่อคำถาม'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <InfoBadge>
                {questions.length} ข้อ
              </InfoBadge>

              <InfoBadge>
                ผ่านเมื่อ ≥{' '}
                {
                  quizSet.passing_score
                }
                %
              </InfoBadge>

              {!result && (
                <InfoBadge>
                  ตอบแล้ว{' '}
                  {answeredCount}/
                  {questions.length}
                </InfoBadge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RESULT */}
      {result && (
        <section
          className={`mt-6 rounded-[30px] border p-7 text-center shadow-sm ${
            result.passed
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-rose-200 bg-rose-50'
          }`}
        >
          {result.passed ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          ) : (
            <XCircle className="mx-auto h-12 w-12 text-rose-600" />
          )}

          <h2 className="mt-4 text-xl font-black text-purple-950">
            {result.passed
              ? 'ผ่านแบบทดสอบประเภทสัตว์แล้ว'
              : 'ยังไม่ผ่านแบบทดสอบ'}
          </h2>

          <div className="mt-3 text-4xl font-black text-purple-700">
            {result.score}%
          </div>

          <p className="mt-2 text-sm text-slate-600">
            ตอบถูก{' '}
            {
              result.correctAnswers
            }{' '}
            จาก{' '}
            {
              result.totalQuestions
            }{' '}
            ข้อ
          </p>

          {result.passed ? (
            nextCategoryId ? (
              <>
                {/* ยังเหลือประเภทที่ 2 */}
                <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-purple-200 bg-purple-50 p-4">
                  <p className="text-xs font-bold text-purple-800">
                    ผ่านประเภทนี้แล้ว
                  </p>

                  <p className="mt-1 text-xs leading-5 text-purple-700">
                    คุณยังมีประเภทสัตว์ที่เลือกไว้อีก 1 ประเภท
                    กรุณาอ่านแนวทางการดูแลและทำแบบทดสอบของประเภทถัดไป
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleNextCategory
                  }
                  className="mt-6 rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
                >
                  ทำประเภทถัดไป
                </button>
              </>
            ) : (
              <>
                {/* ทำครบแล้ว */}
                <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold text-amber-800">
                    ทำแบบทดสอบครบแล้ว
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    คุณผ่านแบบทดสอบของประเภทสัตว์ที่เลือกครบแล้ว
                    ขณะนี้ใบสมัครอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleFinish
                  }
                  className="mt-6 rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
                >
                  ดูสถานะการสมัคร
                </button>
              </>
            )
          ) : (
            <button
              type="button"
              onClick={
                handleRetry
              }
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              ทำแบบทดสอบใหม่
            </button>
          )}
        </section>
      )}

      {/* ERROR */}
      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* QUESTIONS */}
      {!result && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          {questions.map(
            (
              question,
              index
            ) => (
              <article
                key={
                  question.id
                }
                className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <h2 className="text-sm font-black leading-6 text-purple-950 sm:text-base">
                  {index + 1}.{' '}
                  {
                    question.question_text_th
                  }
                </h2>

                <div className="mt-4 space-y-2.5">
                  {question.choices.map(
                    (
                      choice,
                      choiceIndex
                    ) => {
                      const selected =
                        answers[
                          question.id
                        ] ===
                        choice.id;

                      return (
                        <label
                          key={
                            choice.id
                          }
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                            selected
                              ? 'border-purple-400 bg-purple-50'
                              : 'border-purple-100 bg-[#FAF8FE]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            checked={
                              selected
                            }
                            onChange={() =>
                              handleSelect(
                                question.id,
                                choice.id
                              )
                            }
                            className="mt-0.5 h-4 w-4 accent-purple-600"
                          />

                          <span className="text-sm text-slate-700">
                            <strong className="text-purple-700">
                              {String.fromCharCode(
                                65 +
                                  choiceIndex
                              )}
                              .
                            </strong>{' '}
                            {
                              choice.choice_text_th
                            }
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </article>
            )
          )}

          {/* PROGRESS */}
          <div className="sticky bottom-4 rounded-3xl border border-purple-100 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">
                ความคืบหน้า
              </span>

              <span className="font-black text-purple-700">
                {answeredCount}/
                {questions.length}
              </span>
            </div>

            <div className="mb-4 h-2 overflow-hidden rounded-full bg-purple-100">
              <div
                className="h-full rounded-full bg-purple-600 transition-all"
                style={{
                  width:
                    questions.length >
                    0
                      ? `${(answeredCount / questions.length) * 100}%`
                      : '0%',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !allAnswered
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังตรวจคำตอบ...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4" />
                  ส่งคำตอบ
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-purple-50 px-3 py-1.5 text-[10px] font-bold text-purple-700">
      {children}
    </span>
  );
}