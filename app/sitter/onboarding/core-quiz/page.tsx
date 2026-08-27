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
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

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
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
}

export default function CoreQuizPage() {
  const router = useRouter();

  const [sitterProfileId, setSitterProfileId] =
    useState('');

  const [quizSet, setQuizSet] =
    useState<QuizSet | null>(null);

  const [questions, setQuestions] =
    useState<QuizQuestion[]>([]);

  const [answers, setAnswers] =
    useState<Record<string, string>>({});

  const [result, setResult] =
    useState<QuizResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. ตรวจ Login
        const current =
          await AuthService.getCurrentProfile();

        if (!current) {
          router.replace('/login');
          return;
        }

        // 2. ต้องเป็น SITTER
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

        // 3. หา sitter_profiles
        const {
          data: sitterProfile,
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

        if (!sitterProfile) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        setSitterProfileId(
          sitterProfile.id
        );

        // 4. ตรวจว่าแนบเอกสารแล้ว
        // ไม่ต้อง APPROVED จาก Admin
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

        // เอกสารต้องครบ
        if (
          !verification.identity_document_url ||
          !verification.selfie_url
        ) {
          router.replace(
            '/sitter/onboarding/verification'
          );
          return;
        }

        // ถ้าถูกปฏิเสธแล้ว
        if (
          verification.verification_status ===
          'REJECTED'
        ) {
          router.replace(
            '/sitter/onboarding/verification-status'
          );
          return;
        }

        // 5. โหลด Core Quiz
        const {
          data: coreQuiz,
          error: quizError,
        } = await supabase
          .from('quiz_sets')
          .select(`
            id,
            title_th,
            description_th,
            passing_score
          `)
          .eq('quiz_type', 'CORE')
          .eq('is_active', true)
          .order('created_at', {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

        if (quizError) {
          throw new Error(
            quizError.message
          );
        }

        if (!coreQuiz) {
          throw new Error(
            'ยังไม่มี Core Quiz ในระบบ'
          );
        }

        setQuizSet(
          coreQuiz as QuizSet
        );

        // 6. เช็กว่าเคยผ่านแล้วหรือยัง
        const {
          data: passedAttempt,
          error: passedError,
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
            'sitter_id',
            sitterProfile.id
          )
          .eq(
            'quiz_set_id',
            coreQuiz.id
          )
          .eq('passed', true)
          .order('created_at', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (passedError) {
          throw new Error(
            passedError.message
          );
        }

        if (passedAttempt) {
          setResult({
            totalQuestions:
              passedAttempt.total_questions,

            correctAnswers:
              passedAttempt.correct_answers,

            score:
              Number(
                passedAttempt.score
              ),

            passed: true,
          });
        }

        // 7. โหลดคำถาม
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
            coreQuiz.id
          )
          .eq('is_active', true)
          .order('display_order', {
            ascending: true,
          });

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
            'Core Quiz ยังไม่มีคำถาม'
          );
        }

        // 8. โหลดช้อยส์
        const questionIds =
          questionRows.map(
            (question) =>
              question.id
          );

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
          .order('display_order', {
            ascending: true,
          });

        if (choiceError) {
          throw new Error(
            choiceError.message
          );
        }

        const choices =
          choiceData ?? [];

        const mapped:
          QuizQuestion[] =
          questionRows.map(
            (question) => ({
              id: question.id,

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

        setQuestions(mapped);
      } catch (err) {
        console.error(
          'LOAD CORE QUIZ ERROR:',
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
  }, [router]);

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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !quizSet ||
      !sitterProfileId
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

      let correctAnswers = 0;

      questions.forEach(
        (question) => {
          const selectedId =
            answers[
              question.id
            ];

          const selected =
            question.choices.find(
              (choice) =>
                choice.id ===
                selectedId
            );

          if (
            selected?.is_correct
          ) {
            correctAnswers += 1;
          }
        }
      );

      const totalQuestions =
        questions.length;

      const score =
        Number(
          (
            (correctAnswers /
              totalQuestions) *
            100
          ).toFixed(2)
        );

      const passed =
        score >=
        quizSet.passing_score;

      const now =
        new Date().toISOString();

      const {
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

          started_at: now,
          submitted_at: now,
        });

      if (attemptError) {
        throw new Error(
          attemptError.message
        );
      }

      setResult({
        totalQuestions,
        correctAnswers,
        score,
        passed,
      });

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error(
        'SUBMIT CORE QUIZ ERROR:',
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

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
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

  if (!quizSet) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error ||
            'ไม่พบ Core Quiz'}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* HEADER */}
      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              แบบทดสอบพื้นฐาน
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              {quizSet.title_th}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {quizSet.description_th ||
                'แบบทดสอบพื้นฐานสำหรับผู้สมัครเป็นพี่เลี้ยงสัตว์'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <InfoBadge>
                {questions.length} ข้อ
              </InfoBadge>

              <InfoBadge>
                ผ่านเมื่อ ≥{' '}
                {quizSet.passing_score}%
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
          className={`mt-6 rounded-[30px] border p-7 text-center ${
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
              ? 'ผ่านแบบทดสอบพื้นฐานแล้ว'
              : 'ยังไม่ผ่านแบบทดสอบ'}
          </h2>

          <div className="mt-3 text-4xl font-black text-purple-700">
            {result.score}%
          </div>

          <p className="mt-2 text-sm text-slate-600">
            ตอบถูก{' '}
            {result.correctAnswers}{' '}
            จาก{' '}
            {result.totalQuestions}{' '}
            ข้อ
          </p>

          {result.passed ? (
            <button
              type="button"
              onClick={() =>
                router.push(
                  '/sitter/onboarding/categories'
                )
              }
              className="mt-6 rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white"
            >
              เลือกประเภทสัตว์
            </button>
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
                <h2 className="text-sm font-black leading-6 text-purple-950">
                  {index + 1}.{' '}
                  {
                    question.question_text_th
                  }
                </h2>

                <div className="mt-4 space-y-2">
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
                          className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${
                            selected
                              ? 'border-purple-400 bg-purple-50'
                              : 'border-purple-100 bg-[#FAF8FE]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={
                              question.id
                            }
                            checked={
                              selected
                            }
                            onChange={() =>
                              handleSelect(
                                question.id,
                                choice.id
                              )
                            }
                            className="mt-0.5 accent-purple-600"
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

          <button
            type="submit"
            disabled={
              submitting ||
              !allAnswered
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 text-sm font-bold text-white disabled:opacity-50"
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