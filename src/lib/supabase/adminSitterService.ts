import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * TYPES
 * ======================================================= */

export type AdminSitterStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface AdminSitterListItem {
  sitterId: string;
  userId: string;

  firstName: string | null;
  lastName: string | null;
  displayName: string | null;

  verificationStatus: string;

  identityDocumentUrl: string | null;
  selfieUrl: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AdminSitterQuizResult {
  quizSetId: string;

  quizType: string;
  categoryId: string | null;
  titleTh: string;

  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;

  submittedAt: string | null;
}

export interface AdminCertifiedCategory {
  categoryId: string;
  categoryName: string;
  icon: string | null;

  certificationStatus: string | null;
  certifiedAt: string | null;
}

export interface AdminSitterDetail {
  sitterId: string;
  userId: string;

  firstName: string | null;
  lastName: string | null;
  displayName: string | null;

  verificationStatus: string;

  /*
   * Storage path เดิม
   */
  identityDocumentUrl: string | null;
  selfieUrl: string | null;

  /*
   * URL ชั่วคราวสำหรับ Admin ใช้แสดงรูป
   */
  identityDocumentSignedUrl: string | null;
  selfieSignedUrl: string | null;

  adminNote: string | null;
  verifiedAt: string | null;

  isVerified: boolean;
  isAvailable: boolean;

  createdAt: string;
  updatedAt: string;

  quizResults: AdminSitterQuizResult[];
  certifiedCategories: AdminCertifiedCategory[];
}

/* =========================================================
 * SUPABASE RELATION TYPES
 * ======================================================= */

interface ProfileRelation {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
}

interface VerificationRelation {
  verification_status: string;

  identity_document_url: string | null;
  selfie_url: string | null;

  admin_note?: string | null;
  verified_at?: string | null;

  updated_at: string;
}

interface SitterListRow {
  id: string;
  user_id: string;

  created_at: string;
  updated_at: string;

  profiles:
    | ProfileRelation
    | ProfileRelation[]
    | null;

  sitter_verifications:
    | VerificationRelation
    | VerificationRelation[]
    | null;
}

interface SitterDetailRow {
  id: string;
  user_id: string;

  verification_status: string;

  is_verified: boolean;
  is_available: boolean;

  created_at: string;
  updated_at: string;

  profiles:
    | ProfileRelation
    | ProfileRelation[]
    | null;

  sitter_verifications:
    | VerificationRelation
    | VerificationRelation[]
    | null;
}

interface QuizSetRelation {
  quiz_type: string;
  category_id: string | null;
  title_th: string;
}

interface QuizAttemptRow {
  quiz_set_id: string;

  total_questions: number;
  correct_answers: number;

  score: number | string;
  passed: boolean;

  submitted_at: string | null;

  quiz_sets:
    | QuizSetRelation
    | QuizSetRelation[]
    | null;
}

interface CategoryRelation {
  name_th: string;
  icon: string | null;
}

interface SitterCategoryRow {
  category_id: string;

  certification_status: string | null;
  certified_at: string | null;

  pet_categories:
    | CategoryRelation
    | CategoryRelation[]
    | null;
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

function getDisplayName(
  profile: ProfileRelation | null
): string | null {
  if (!profile) {
    return null;
  }

  if (profile.display_name?.trim()) {
    return profile.display_name.trim();
  }

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || null;
}

/* =========================================================
 * PRIVATE STORAGE
 * ======================================================= */

const SITTER_VERIFICATION_BUCKET =
  'sitter-verifications';

/*
 * Signed URL สำหรับ private bucket
 * ใช้ได้ 10 นาที
 */
async function createVerificationSignedUrl(
  path: string | null | undefined
): Promise<string | null> {
  if (!path) {
    return null;
  }

  const { data, error } =
    await supabase.storage
      .from(
        SITTER_VERIFICATION_BUCKET
      )
      .createSignedUrl(
        path,
        60 * 10
      );

  if (error) {
    console.error(
      'CREATE VERIFICATION SIGNED URL ERROR:',
      error
    );

    return null;
  }

  return data.signedUrl;
}

/* =========================================================
 * SERVICE
 * ======================================================= */

export const AdminSitterService = {
  /* =======================================================
   * GET ALL SITTERS
   * ===================================================== */

  async getSitters(): Promise<
    AdminSitterListItem[]
  > {
    const {
      data,
      error,
    } = await supabase
      .from('sitter_profiles')
      .select(`
        id,
        user_id,
        created_at,
        updated_at,

        profiles (
          first_name,
          last_name,
          display_name
        ),

        sitter_verifications (
          verification_status,
          identity_document_url,
          selfie_url,
          updated_at
        )
      `)
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'GET ADMIN SITTERS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดรายชื่อผู้สมัคร Sitter ได้'
      );
    }

    const rows =
      (data ??
        []) as unknown as SitterListRow[];

    return rows.map(
      (
        row
      ): AdminSitterListItem => {
        const profile =
          getSingleRelation(
            row.profiles
          );

        const verification =
          getSingleRelation(
            row.sitter_verifications
          );

        return {
          sitterId:
            row.id,

          userId:
            row.user_id,

          firstName:
            profile?.first_name ??
            null,

          lastName:
            profile?.last_name ??
            null,

          displayName:
            getDisplayName(
              profile
            ),

          verificationStatus:
            verification
              ?.verification_status ??
            'PENDING',

          identityDocumentUrl:
            verification
              ?.identity_document_url ??
            null,

          selfieUrl:
            verification
              ?.selfie_url ??
            null,

          createdAt:
            row.created_at,

          updatedAt:
            verification?.updated_at ??
            row.updated_at,
        };
      }
    );
  },

  /* =======================================================
   * GET SITTER DETAIL
   * ===================================================== */

  async getSitterById(
    sitterId: string
  ): Promise<AdminSitterDetail | null> {
    if (!sitterId) {
      return null;
    }

    /* =====================================================
     * 1. โหลดข้อมูล Sitter
     * =================================================== */

    const {
      data,
      error: sitterError,
    } = await supabase
      .from('sitter_profiles')
      .select(`
        id,
        user_id,
        verification_status,
        is_verified,
        is_available,
        created_at,
        updated_at,

        profiles (
          first_name,
          last_name,
          display_name
        ),

        sitter_verifications (
          verification_status,
          identity_document_url,
          selfie_url,
          admin_note,
          verified_at,
          updated_at
        )
      `)
      .eq(
        'id',
        sitterId
      )
      .maybeSingle();

    if (sitterError) {
      console.error(
        'GET ADMIN SITTER DETAIL ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message ||
          'ไม่สามารถโหลดรายละเอียด Sitter ได้'
      );
    }

    if (!data) {
      return null;
    }

    const sitter =
      data as unknown as SitterDetailRow;

    const profile =
      getSingleRelation(
        sitter.profiles
      );

    const verification =
      getSingleRelation(
        sitter.sitter_verifications
      );

    /* =====================================================
     * 2. โหลด Quiz Attempts ที่ผ่านแล้ว
     * =================================================== */

    const {
      data: attemptData,
      error: attemptError,
    } = await supabase
      .from('quiz_attempts')
      .select(`
        quiz_set_id,
        total_questions,
        correct_answers,
        score,
        passed,
        submitted_at,

        quiz_sets (
          quiz_type,
          category_id,
          title_th
        )
      `)
      .eq(
        'sitter_id',
        sitterId
      )
      .eq(
        'passed',
        true
      )
      .order(
        'submitted_at',
        {
          ascending: true,
        }
      );

    if (attemptError) {
      console.error(
        'GET ADMIN SITTER QUIZ ERROR:',
        attemptError
      );

      throw new Error(
        attemptError.message ||
          'ไม่สามารถโหลดผลแบบทดสอบได้'
      );
    }

    const attemptRows =
      (attemptData ??
        []) as unknown as QuizAttemptRow[];

    const quizResults:
      AdminSitterQuizResult[] =
      attemptRows.map(
        (
          attempt
        ): AdminSitterQuizResult => {
          const quizSet =
            getSingleRelation(
              attempt.quiz_sets
            );

          return {
            quizSetId:
              attempt.quiz_set_id,

            quizType:
              quizSet?.quiz_type ??
              '',

            categoryId:
              quizSet?.category_id ??
              null,

            titleTh:
              quizSet?.title_th ??
              'แบบทดสอบ',

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

            submittedAt:
              attempt.submitted_at,
          };
        }
      );

    /* =====================================================
     * 3. โหลดประเภทสัตว์ที่ผ่านการรับรอง
     * =================================================== */

    const {
      data: categoryData,
      error: categoryError,
    } = await supabase
      .from('sitter_categories')
      .select(`
        category_id,
        certification_status,
        certified_at,

        pet_categories (
          name_th,
          icon
        )
      `)
      .eq(
        'sitter_id',
        sitterId
      )
      .eq(
        'certification_status',
        'CERTIFIED'
      );

    if (categoryError) {
      console.error(
        'GET ADMIN SITTER CATEGORY ERROR:',
        categoryError
      );

      throw new Error(
        categoryError.message ||
          'ไม่สามารถโหลดประเภทสัตว์ที่ผ่านการรับรองได้'
      );
    }

    const categoryRows =
      (categoryData ??
        []) as unknown as SitterCategoryRow[];

    const certifiedCategories:
      AdminCertifiedCategory[] =
      categoryRows.map(
        (
          item
        ): AdminCertifiedCategory => {
          const category =
            getSingleRelation(
              item.pet_categories
            );

          return {
            categoryId:
              item.category_id,

            categoryName:
              category?.name_th ??
              item.category_id,

            icon:
              category?.icon ??
              null,

            certificationStatus:
              item.certification_status,

            certifiedAt:
              item.certified_at,
          };
        }
      );

    /* =====================================================
     * 4. สร้าง Signed URL ของเอกสาร
     * =================================================== */

    const [
      identityDocumentSignedUrl,
      selfieSignedUrl,
    ] = await Promise.all([
      createVerificationSignedUrl(
        verification?.identity_document_url
      ),

      createVerificationSignedUrl(
        verification?.selfie_url
      ),
    ]);

    /* =====================================================
     * 5. รวมข้อมูลทั้งหมด
     * =================================================== */

    return {
      sitterId:
        sitter.id,

      userId:
        sitter.user_id,

      firstName:
        profile?.first_name ??
        null,

      lastName:
        profile?.last_name ??
        null,

      displayName:
        getDisplayName(
          profile
        ),

      verificationStatus:
        verification
          ?.verification_status ??
        sitter.verification_status,

      identityDocumentUrl:
        verification
          ?.identity_document_url ??
        null,

      selfieUrl:
        verification
          ?.selfie_url ??
        null,

      identityDocumentSignedUrl,

      selfieSignedUrl,

      adminNote:
        verification?.admin_note ??
        null,

      verifiedAt:
        verification?.verified_at ??
        null,

      isVerified:
        sitter.is_verified,

      isAvailable:
        sitter.is_available,

      createdAt:
        sitter.created_at,

      updatedAt:
        verification?.updated_at ??
        sitter.updated_at,

      quizResults,

      certifiedCategories,
    };
  },

  /* =======================================================
   * APPROVE SITTER
   * ===================================================== */

  async approveSitter(
    sitterId: string,
    adminUserId: string
  ): Promise<void> {
    if (!sitterId) {
      throw new Error(
        'ไม่พบรหัส Sitter'
      );
    }

    if (!adminUserId) {
      throw new Error(
        'ไม่พบข้อมูลผู้ดูแลระบบ'
      );
    }

    const now =
      new Date().toISOString();

    /* =====================================================
     * 1. อนุมัติ sitter_verifications
     * =================================================== */

    const {
      error: verificationError,
    } = await supabase
      .from(
        'sitter_verifications'
      )
      .update({
        verification_status:
          'APPROVED',

        admin_note:
          null,

        verified_by:
          adminUserId,

        verified_at:
          now,

        updated_at:
          now,
      })
      .eq(
        'sitter_id',
        sitterId
      );

    if (verificationError) {
      console.error(
        'APPROVE SITTER VERIFICATION ERROR:',
        verificationError
      );

      throw new Error(
        verificationError.message ||
          'ไม่สามารถอนุมัติข้อมูลยืนยันตัวตนได้'
      );
    }

    /* =====================================================
     * 2. อนุมัติ sitter_profiles
     *
     * ยังไม่เปิดรับงานอัตโนมัติ
     * =================================================== */

    const {
      error: sitterError,
    } = await supabase
      .from('sitter_profiles')
      .update({
        verification_status:
          'APPROVED',

        is_verified:
          true,

        is_available:
          false,

        updated_at:
          now,
      })
      .eq(
        'id',
        sitterId
      );

    if (sitterError) {
      console.error(
        'APPROVE SITTER PROFILE ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message ||
          'ไม่สามารถอัปเดตสถานะ Sitter ได้'
      );
    }
  },

  /* =======================================================
   * REJECT SITTER
   * ===================================================== */

  async rejectSitter(
    sitterId: string,
    adminUserId: string,
    reason: string
  ): Promise<void> {
    if (!sitterId) {
      throw new Error(
        'ไม่พบรหัส Sitter'
      );
    }

    if (!adminUserId) {
      throw new Error(
        'ไม่พบข้อมูลผู้ดูแลระบบ'
      );
    }

    const trimmedReason =
      reason.trim();

    if (!trimmedReason) {
      throw new Error(
        'กรุณาระบุเหตุผลที่ไม่อนุมัติ'
      );
    }

    const now =
      new Date().toISOString();

    /* =====================================================
     * 1. ปฏิเสธ sitter_verifications
     * =================================================== */

    const {
      error: verificationError,
    } = await supabase
      .from(
        'sitter_verifications'
      )
      .update({
        verification_status:
          'REJECTED',

        admin_note:
          trimmedReason,

        verified_by:
          adminUserId,

        verified_at:
          now,

        updated_at:
          now,
      })
      .eq(
        'sitter_id',
        sitterId
      );

    if (verificationError) {
      console.error(
        'REJECT SITTER VERIFICATION ERROR:',
        verificationError
      );

      throw new Error(
        verificationError.message ||
          'ไม่สามารถปฏิเสธข้อมูลยืนยันตัวตนได้'
      );
    }

    /* =====================================================
     * 2. ปฏิเสธ sitter_profiles
     * =================================================== */

    const {
      error: sitterError,
    } = await supabase
      .from('sitter_profiles')
      .update({
        verification_status:
          'REJECTED',

        is_verified:
          false,

        is_available:
          false,

        updated_at:
          now,
      })
      .eq(
        'id',
        sitterId
      );

    if (sitterError) {
      console.error(
        'REJECT SITTER PROFILE ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message ||
          'ไม่สามารถอัปเดตสถานะ Sitter ได้'
      );
    }
  },
};