import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * TYPES
 * ======================================================= */

export type AdminQuizType =
  | 'CORE'
  | 'CATEGORY';

export interface AdminQuizListItem {
  id: string;
  quizType: AdminQuizType;
  categoryId: string | null;

  titleTh: string;
  descriptionTh: string | null;

  passingScore: number;
  isActive: boolean;

  questionCount: number;

  categoryName: string | null;
  categoryIcon: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AdminQuizChoice {
  id: string;
  choiceTextTh: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface AdminQuizQuestion {
  id: string;
  questionTextTh: string;
  explanationTh: string | null;
  displayOrder: number;
  isActive: boolean;

  choices: AdminQuizChoice[];
}

export interface AdminQuizDetail
  extends AdminQuizListItem {
  questions: AdminQuizQuestion[];
}

/* =========================================================
 * DATABASE TYPES
 * ======================================================= */

interface CategoryRelation {
  name_th: string;
  icon: string | null;
}

interface QuizSetRow {
  id: string;
  quiz_type: string;
  category_id: string | null;

  title_th: string;
  description_th: string | null;

  passing_score: number;
  is_active: boolean;

  created_at: string;
  updated_at: string;

  pet_categories:
    | CategoryRelation
    | CategoryRelation[]
    | null;
}

interface QuestionRow {
  id: string;

  question_text_th: string;
  explanation_th: string | null;

  display_order: number;
  is_active: boolean;
}

interface ChoiceRow {
  id: string;
  question_id: string;

  choice_text_th: string;
  is_correct: boolean;

  display_order: number;
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function getSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function normalizeQuizType(
  value: string
): AdminQuizType {
  return value.toUpperCase() === 'CATEGORY'
    ? 'CATEGORY'
    : 'CORE';
}

/* =========================================================
 * SERVICE
 * ======================================================= */

export const AdminQuizService = {
  /* =======================================================
   * GET QUIZ SETS
   * ===================================================== */

  async getQuizzes(): Promise<
    AdminQuizListItem[]
  > {
    const {
      data,
      error,
    } = await supabase
      .from('quiz_sets')
      .select(`
        id,
        quiz_type,
        category_id,
        title_th,
        description_th,
        passing_score,
        is_active,
        created_at,
        updated_at,

        pet_categories (
          name_th,
          icon
        )
      `)
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        'GET ADMIN QUIZZES ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดแบบทดสอบได้'
      );
    }

    const rows =
      (data ??
        []) as unknown as QuizSetRow[];

    const result:
      AdminQuizListItem[] = [];

    for (const row of rows) {
      const category =
        getSingleRelation(
          row.pet_categories
        );

      const {
        count,
        error:
          questionCountError,
      } = await supabase
        .from('quiz_questions')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          }
        )
        .eq(
          'quiz_set_id',
          row.id
        );

      if (
        questionCountError
      ) {
        throw new Error(
          questionCountError.message
        );
      }

      result.push({
        id:
          row.id,

        quizType:
          normalizeQuizType(
            row.quiz_type
          ),

        categoryId:
          row.category_id,

        titleTh:
          row.title_th,

        descriptionTh:
          row.description_th,

        passingScore:
          row.passing_score,

        isActive:
          row.is_active,

        questionCount:
          count ?? 0,

        categoryName:
          category?.name_th ??
          null,

        categoryIcon:
          category?.icon ??
          null,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,
      });
    }

    return result;
  },

  /* =======================================================
   * GET QUIZ DETAIL
   * ===================================================== */

  async getQuizById(
    quizId: string
  ): Promise<AdminQuizDetail | null> {
    if (!quizId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from('quiz_sets')
      .select(`
        id,
        quiz_type,
        category_id,
        title_th,
        description_th,
        passing_score,
        is_active,
        created_at,
        updated_at,

        pet_categories (
          name_th,
          icon
        )
      `)
      .eq(
        'id',
        quizId
      )
      .maybeSingle();

    if (error) {
      console.error(
        'GET ADMIN QUIZ DETAIL ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดรายละเอียดแบบทดสอบได้'
      );
    }

    if (!data) {
      return null;
    }

    const row =
      data as unknown as QuizSetRow;

    const category =
      getSingleRelation(
        row.pet_categories
      );

    const {
      data: questionData,
      error: questionError,
    } = await supabase
      .from('quiz_questions')
      .select(`
        id,
        question_text_th,
        explanation_th,
        display_order,
        is_active
      `)
      .eq(
        'quiz_set_id',
        quizId
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
      (questionData ??
        []) as unknown as QuestionRow[];

    const questionIds =
      questionRows.map(
        (item) =>
          item.id
      );

    let choiceRows:
      ChoiceRow[] = [];

    if (
      questionIds.length >
      0
    ) {
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

      choiceRows =
        (choiceData ??
          []) as unknown as ChoiceRow[];
    }

    const questions:
      AdminQuizQuestion[] =
      questionRows.map(
        (question) => ({
          id:
            question.id,

          questionTextTh:
            question.question_text_th,

          explanationTh:
            question.explanation_th,

          displayOrder:
            question.display_order,

          isActive:
            question.is_active,

          choices:
            choiceRows
              .filter(
                (choice) =>
                  choice.question_id ===
                  question.id
              )
              .map(
                (
                  choice
                ): AdminQuizChoice => ({
                  id:
                    choice.id,

                  choiceTextTh:
                    choice.choice_text_th,

                  isCorrect:
                    choice.is_correct,

                  displayOrder:
                    choice.display_order,
                })
              ),
        })
      );

    return {
      id:
        row.id,

      quizType:
        normalizeQuizType(
          row.quiz_type
        ),

      categoryId:
        row.category_id,

      titleTh:
        row.title_th,

      descriptionTh:
        row.description_th,

      passingScore:
        row.passing_score,

      isActive:
        row.is_active,

      questionCount:
        questions.length,

      categoryName:
        category?.name_th ??
        null,

      categoryIcon:
        category?.icon ??
        null,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,

      questions,
    };
  },
};