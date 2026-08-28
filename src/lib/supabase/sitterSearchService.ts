import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * CONFIG
 * ======================================================= */

/**
 * Bucket สำหรับรูปโปรไฟล์
 *
 * ถ้ามี env:
 * NEXT_PUBLIC_PROFILE_IMAGE_BUCKET
 * จะใช้ค่านั้นก่อน
 *
 * ถ้าไม่มี จะใช้ profile-images
 */
const PROFILE_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_PROFILE_IMAGE_BUCKET ||
  'profile-images';

/* =========================================================
 * PUBLIC TYPES
 * ======================================================= */

export interface SitterSearchResult {
  sitterProfileId: string;

  userId: string;

  displayName: string;

  /**
   * URL ที่พร้อมใช้กับ <img src="">
   */
  avatarUrl: string | null;

  bio: string | null;

  province: string;

  district: string;

  area: string;

  houseType: string | null;

  specialty: string | null;

  experienceYears: number;

  startingPrice: number;

  isVerified: boolean;

  isAvailable: boolean;

  /**
   * categories มาจากบริการที่เปิดใช้งานจริง
   */
  categories: string[];

  averageRating: number;

  reviewCount: number;

  /** คะแนน Review แปลงเป็น 0-100 */
  reviewScore: number;

  /** คะแนนประสบการณ์ 0-100 (5 ปีขึ้นไป = 100) */
  experienceScore: number;

  /** คะแนน Core Quiz ล่าสุดที่ผ่าน */
  coreQuizScore: number;

  /** คะแนน Category Quiz แยกตาม category_id */
  categoryQuizScores: Record<string, number>;

  /** คะแนน Quiz รวม */
  quizScore: number;

  /** คะแนน Recommendation รวม */
  recommendationScore: number;

  /** true เมื่อยังไม่มีรีวิว */
  isNewSitter: boolean;
}

/* =========================================================
 * DATABASE TYPES
 * ======================================================= */

interface SitterProfileRow {
  id: string;

  user_id: string;

  location_id: string | null;

  house_type: string | null;

  specialty: string | null;

  experience_years: number | null;

  starting_price:
    | number
    | string
    | null;

  is_verified: boolean;

  is_available: boolean;

  verification_status:
    | string
    | null;
}

interface ProfileRow {
  id: string;

  display_name:
    | string
    | null;

  first_name:
    | string
    | null;

  last_name:
    | string
    | null;

  avatar_url:
    | string
    | null;

  bio:
    | string
    | null;
}

interface LocationRow {
  id: string;

  province:
    | string
    | null;

  district:
    | string
    | null;

  area:
    | string
    | null;
}

interface ServiceRow {
  id: string;

  sitter_id: string;

  category_id: string;

  price:
    | number
    | string;

  is_active: boolean;
}

interface ReviewRow {
  sitter_id: string;

  rating:
    | number
    | string;
}

interface QuizAttemptRow {
  id: string;
  sitter_id: string;
  quiz_set_id: string;
  score: number | string;
  passed: boolean;
  created_at: string;
}

interface QuizSetMetaRow {
  id: string;
  quiz_type: string;
  category_id: string | null;
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function uniqueStrings(
  values: string[]
) {
  return Array.from(
    new Set(values)
  );
}

/* =========================================================
 * CLEAN ID
 * ======================================================= */

function cleanId(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return null;
  }

  const cleaned =
    value.trim();

  if (
    !cleaned ||
    cleaned === 'null' ||
    cleaned === 'undefined'
  ) {
    return null;
  }

  return cleaned;
}

/* =========================================================
 * DISPLAY NAME
 * ======================================================= */

function getDisplayName(
  profile:
    | ProfileRow
    | undefined
) {
  const displayName =
    profile?.display_name
      ?.trim();

  if (displayName) {
    return displayName;
  }

  const fullName =
    [
      profile?.first_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

  return (
    fullName ||
    'ผู้รับฝากสัตว์เลี้ยง'
  );
}

/* =========================================================
 * AVATAR
 * ======================================================= */

/**
 * แปลง avatar_url จาก database
 * ให้เป็น URL ที่พร้อมใช้กับ <img>
 *
 * รองรับ:
 *
 * 1. URL เต็ม
 * https://xxx.supabase.co/storage/...
 *
 * 2. path ธรรมดา
 * user-id/avatar.jpg
 *
 * 3. path ที่มี bucket
 * profile-images/user-id/avatar.jpg
 *
 * 4. path แบบ storage public
 * storage/v1/object/public/profile-images/...
 */
function getAvatarUrl(
  value:
    | string
    | null
    | undefined
): string | null {
  if (!value) {
    return null;
  }

  const clean =
    value.trim();

  if (
    !clean ||
    clean === 'null' ||
    clean === 'undefined'
  ) {
    return null;
  }

  /* =====================================================
   * URL เต็มอยู่แล้ว
   * =================================================== */

  if (
    clean.startsWith(
      'https://'
    ) ||
    clean.startsWith(
      'http://'
    )
  ) {
    return clean;
  }

  /* =====================================================
   * ลบ / ด้านหน้า
   * =================================================== */

  let normalized =
    clean.replace(
      /^\/+/,
      ''
    );

  /* =====================================================
   * รองรับค่าแบบ
   * storage/v1/object/public/profile-images/xxx.jpg
   * =================================================== */

  const publicStorageMarker =
    'storage/v1/object/public/';

  if (
    normalized.includes(
      publicStorageMarker
    )
  ) {
    const afterMarker =
      normalized.split(
        publicStorageMarker
      )[1];

    if (afterMarker) {
      normalized =
        afterMarker;
    }
  }

  /* =====================================================
   * DETECT BUCKET
   * =================================================== */

  let bucket =
    PROFILE_IMAGE_BUCKET;

  let filePath =
    normalized;

  /* profile-images/... */

  if (
    normalized.startsWith(
      'profile-images/'
    )
  ) {
    bucket =
      'profile-images';

    filePath =
      normalized.substring(
        'profile-images/'.length
      );
  }

  /* avatars/... */

  else if (
    normalized.startsWith(
      'avatars/'
    )
  ) {
    bucket =
      'avatars';

    filePath =
      normalized.substring(
        'avatars/'.length
      );
  }

  /* profile-avatars/... */

  else if (
    normalized.startsWith(
      'profile-avatars/'
    )
  ) {
    bucket =
      'profile-avatars';

    filePath =
      normalized.substring(
        'profile-avatars/'.length
      );
  }

  /* sitter-avatars/... */

  else if (
    normalized.startsWith(
      'sitter-avatars/'
    )
  ) {
    bucket =
      'sitter-avatars';

    filePath =
      normalized.substring(
        'sitter-avatars/'.length
      );
  }

  filePath =
    filePath.replace(
      /^\/+/,
      ''
    );

  if (!filePath) {
    return null;
  }

  /* =====================================================
   * CREATE PUBLIC URL
   * =================================================== */

  const {
    data,
  } =
    supabase.storage
      .from(bucket)
      .getPublicUrl(
        filePath
      );

  const publicUrl =
    data.publicUrl
      ?.trim();

  if (!publicUrl) {
    return null;
  }

  return publicUrl;
}

/* =========================================================
 * RECOMMENDATION HELPERS
 * ======================================================= */

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function roundScore(value: number): number {
  return Number(value.toFixed(1));
}

function calculateReviewScore(averageRating: number): number {
  return clampScore((averageRating / 5) * 100);
}

function calculateExperienceScore(experienceYears: number): number {
  const years = Math.max(0, Number(experienceYears) || 0);
  return clampScore((Math.min(years, 5) / 5) * 100);
}

function calculateCombinedQuizScore(
  coreQuizScore: number,
  categoryScores: number[]
): number {
  const validCategoryScores = categoryScores.filter((score) =>
    Number.isFinite(score)
  );

  const categoryAverage =
    validCategoryScores.length > 0
      ? validCategoryScores.reduce((total, score) => total + score, 0) /
        validCategoryScores.length
      : 0;

  const hasCore = coreQuizScore > 0;
  const hasCategory = validCategoryScores.length > 0;

  if (hasCore && hasCategory) {
    return roundScore((coreQuizScore + categoryAverage) / 2);
  }

  if (hasCore) {
    return roundScore(coreQuizScore);
  }

  if (hasCategory) {
    return roundScore(categoryAverage);
  }

  return 0;
}

function calculateRecommendationScore({
  reviewScore,
  quizScore,
  experienceScore,
  isNewSitter,
}: {
  reviewScore: number;
  quizScore: number;
  experienceScore: number;
  isNewSitter: boolean;
}): number {
  if (isNewSitter) {
    // Cold Start: Quiz 70% + Experience 30%
    return roundScore(quizScore * 0.7 + experienceScore * 0.3);
  }

  // สูตรปกติ: Review 50% + Quiz 30% + Experience 20%
  return roundScore(
    reviewScore * 0.5 + quizScore * 0.3 + experienceScore * 0.2
  );
}

/* =========================================================
 * SERVICE
 * ======================================================= */

export const SitterSearchService = {
  async getSitters(): Promise<
    SitterSearchResult[]
  > {
    /* =====================================================
     * 1. LOAD VERIFIED + AVAILABLE SITTERS
     * =================================================== */

    const {
      data:
        sitterProfiles,

      error:
        sitterError,
    } =
      await supabase
        .from(
          'sitter_profiles'
        )
        .select(`
          id,
          user_id,
          location_id,
          house_type,
          specialty,
          experience_years,
          starting_price,
          is_verified,
          is_available,
          verification_status
        `)
        .eq(
          'is_available',
          true
        )
        .eq(
          'is_verified',
          true
        );

    if (sitterError) {
      console.error(
        'GET SITTER PROFILES ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message ||
          'ไม่สามารถโหลดข้อมูลผู้รับฝากได้'
      );
    }

    const allSitters =
      (
        sitterProfiles ??
        []
      ) as SitterProfileRow[];

    if (
      allSitters.length ===
      0
    ) {
      console.log(
        'SEARCH SITTER: no verified + available sitter'
      );

      return [];
    }

    /* =====================================================
     * CLEAN SITTER IDS
     * =================================================== */

    const sitterIds =
      allSitters
        .map(
          (
            sitter
          ) =>
            cleanId(
              sitter.id
            )
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(
              value
            )
        );

    if (
      sitterIds.length ===
      0
    ) {
      return [];
    }

    /* =====================================================
     * 2. LOAD ACTIVE SERVICES
     * =================================================== */

    const {
      data:
        serviceData,

      error:
        serviceError,
    } =
      await supabase
        .from(
          'sitter_services'
        )
        .select(`
          id,
          sitter_id,
          category_id,
          price,
          is_active
        `)
        .in(
          'sitter_id',
          sitterIds
        )
        .eq(
          'is_active',
          true
        );

    if (
      serviceError
    ) {
      console.error(
        'GET ACTIVE SITTER SERVICES ERROR:',
        serviceError
      );

      throw new Error(
        serviceError.message ||
          'ไม่สามารถโหลดบริการของผู้รับฝากได้'
      );
    }

    const activeServices =
      (
        serviceData ??
        []
      ) as ServiceRow[];

    /* =====================================================
     * KEEP ONLY SITTERS WITH ACTIVE SERVICE
     * =================================================== */

    const sitterIdsWithService =
      new Set(
        activeServices.map(
          (
            service
          ) =>
            service.sitter_id
        )
      );

    const sitters =
      allSitters.filter(
        (
          sitter
        ) =>
          sitterIdsWithService.has(
            sitter.id
          )
      );

    console.log(
      'SEARCH SITTER DEBUG:',
      {
        availableVerified:
          allSitters.length,

        activeServices:
          activeServices.length,

        visibleSitters:
          sitters.length,
      }
    );

    if (
      sitters.length ===
      0
    ) {
      console.log(
        'SEARCH SITTER: verified sitters found, but no active services'
      );

      return [];
    }

    /* =====================================================
     * 3. PREPARE IDS
     * =================================================== */

    const visibleSitterIds =
      sitters
        .map(
          (
            sitter
          ) =>
            cleanId(
              sitter.id
            )
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(
              value
            )
        );

    const userIds =
      uniqueStrings(
        sitters
          .map(
            (
              sitter
            ) =>
              cleanId(
                sitter.user_id
              )
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(
                value
              )
          )
      );

    const locationIds =
      uniqueStrings(
        sitters
          .map(
            (
              sitter
            ) =>
              cleanId(
                sitter.location_id
              )
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(
                value
              )
          )
      );

    /* =====================================================
     * 4. LOAD USER PROFILES
     * =================================================== */

    let profiles:
      ProfileRow[] = [];

    if (
      userIds.length >
      0
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'profiles'
          )
          .select(`
            id,
            display_name,
            first_name,
            last_name,
            avatar_url,
            bio
          `)
          .in(
            'id',
            userIds
          );

      if (error) {
        console.error(
          'GET SITTER USER PROFILES ERROR:',
          error
        );

        throw new Error(
          error.message ||
            'ไม่สามารถโหลดข้อมูลโปรไฟล์ผู้รับฝากได้'
        );
      }

      profiles =
        (
          data ??
          []
        ) as ProfileRow[];
    }

    /* =====================================================
     * DEBUG AVATAR
     * =================================================== */

    console.log(
      'SITTER PROFILE AVATAR DEBUG:',
      profiles.map(
        (
          profile
        ) => ({
          userId:
            profile.id,

          rawAvatar:
            profile.avatar_url,

          resolvedAvatar:
            getAvatarUrl(
              profile.avatar_url
            ),
        })
      )
    );

    /* =====================================================
     * 5. LOCATIONS
     * =================================================== */

    let locations:
      LocationRow[] = [];

    if (
      locationIds.length >
      0
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'locations'
          )
          .select(`
            id,
            province,
            district,
            area
          `)
          .in(
            'id',
            locationIds
          );

      if (error) {
        console.error(
          'GET SITTER LOCATIONS ERROR:',
          error
        );

        throw new Error(
          error.message ||
            'ไม่สามารถโหลดข้อมูลสถานที่ได้'
        );
      }

      locations =
        (
          data ??
          []
        ) as LocationRow[];
    }

    /* =====================================================
     * 6. REVIEWS
     * =================================================== */

    let reviews:
      ReviewRow[] = [];

    if (
      visibleSitterIds.length >
      0
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'reviews'
          )
          .select(`
            sitter_id,
            rating
          `)
          .in(
            'sitter_id',
            visibleSitterIds
          );

      if (error) {
        console.error(
          'GET SITTER REVIEWS ERROR:',
          error
        );

        /**
         * Review ไม่ควรทำให้ search ทั้งหน้าพัง
         */
        reviews =
          [];
      } else {
        reviews =
          (
            data ??
            []
          ) as ReviewRow[];
      }
    }

    /* =====================================================
     * 7. QUIZ ATTEMPTS
     * =================================================== */

    let quizAttempts: QuizAttemptRow[] = [];

    if (visibleSitterIds.length > 0) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          sitter_id,
          quiz_set_id,
          score,
          passed,
          created_at
        `)
        .in('sitter_id', visibleSitterIds)
        .eq('passed', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('GET SITTER QUIZ ATTEMPTS ERROR:', error);
        quizAttempts = [];
      } else {
        quizAttempts = (data ?? []) as QuizAttemptRow[];
      }
    }

    /* =====================================================
     * 8. QUIZ SET META
     * =================================================== */

    const quizSetIds = uniqueStrings(
      quizAttempts
        .map((attempt) => cleanId(attempt.quiz_set_id))
        .filter((value): value is string => Boolean(value))
    );

    let quizSets: QuizSetMetaRow[] = [];

    if (quizSetIds.length > 0) {
      const { data, error } = await supabase
        .from('quiz_sets')
        .select(`
          id,
          quiz_type,
          category_id
        `)
        .in('id', quizSetIds);

      if (error) {
        console.error('GET RECOMMENDATION QUIZ SETS ERROR:', error);
        quizSets = [];
      } else {
        quizSets = (data ?? []) as QuizSetMetaRow[];
      }
    }

    /* =====================================================
     * 9. MAP RESULT
     * =================================================== */

    const results =
      sitters.map(
        (
          sitter
        ): SitterSearchResult => {
          /* ===============================================
           * USER PROFILE
           * ============================================= */

          const profile =
            profiles.find(
              (
                item
              ) =>
                item.id ===
                sitter.user_id
            );

          /* ===============================================
           * LOCATION
           * ============================================= */

          const cleanLocationId =
            cleanId(
              sitter.location_id
            );

          const location =
            cleanLocationId
              ? locations.find(
                  (
                    item
                  ) =>
                    item.id ===
                    cleanLocationId
                )
              : undefined;

          /* ===============================================
           * ACTIVE SERVICES
           * ============================================= */

          const sitterServices =
            activeServices.filter(
              (
                service
              ) =>
                service.sitter_id ===
                sitter.id
            );

          /* ===============================================
           * CATEGORIES
           * ============================================= */

          const sitterCategories =
            uniqueStrings(
              sitterServices
                .map(
                  (
                    service
                  ) =>
                    service.category_id
                )
                .filter(
                  Boolean
                )
            );

          /* ===============================================
           * STARTING PRICE
           * ============================================= */

          const servicePrices =
            sitterServices
              .map(
                (
                  service
                ) =>
                  Number(
                    service.price
                  )
              )
              .filter(
                (
                  price
                ) =>
                  Number.isFinite(
                    price
                  ) &&
                  price >=
                    0
              );

          const serviceStartingPrice =
            servicePrices.length >
            0
              ? Math.min(
                  ...servicePrices
                )
              : null;

          const profileStartingPrice =
            Number(
              sitter.starting_price ??
                0
            );

          const startingPrice =
            serviceStartingPrice ??
            (
              Number.isFinite(
                profileStartingPrice
              )
                ? profileStartingPrice
                : 0
            );

          /* ===============================================
           * REVIEWS
           * ============================================= */

          const sitterReviews =
            reviews.filter(
              (
                item
              ) =>
                item.sitter_id ===
                sitter.id
            );

          const validRatings =
            sitterReviews
              .map(
                (
                  item
                ) =>
                  Number(
                    item.rating
                  )
              )
              .filter(
                (
                  rating
                ) =>
                  Number.isFinite(
                    rating
                  )
              );

          const reviewCount =
            validRatings.length;

          const averageRating =
            reviewCount >
            0
              ? validRatings.reduce(
                  (
                    total,
                    rating
                  ) =>
                    total +
                    rating,
                  0
                ) /
                reviewCount
              : 0;

          /* ===============================================
           * RECOMMENDATION
           * ============================================= */

          const experienceYears = Number(
            sitter.experience_years ?? 0
          );

          const reviewScore = roundScore(
            calculateReviewScore(averageRating)
          );

          const experienceScore = roundScore(
            calculateExperienceScore(experienceYears)
          );

          const sitterQuizAttempts = quizAttempts.filter(
            (attempt) => attempt.sitter_id === sitter.id
          );

          // Query ถูกเรียงจาก attempt ใหม่ไปเก่าแล้ว
          // จึงเก็บตัวแรกของแต่ละ quiz_set เป็นผลล่าสุดที่ผ่าน
          const latestAttemptByQuizSet = new Map<
            string,
            QuizAttemptRow
          >();

          for (const attempt of sitterQuizAttempts) {
            if (!latestAttemptByQuizSet.has(attempt.quiz_set_id)) {
              latestAttemptByQuizSet.set(
                attempt.quiz_set_id,
                attempt
              );
            }
          }

          let coreQuizScore = 0;
          const categoryQuizScores: Record<string, number> = {};

          for (const attempt of latestAttemptByQuizSet.values()) {
            const quizSet = quizSets.find(
              (item) => item.id === attempt.quiz_set_id
            );

            if (!quizSet) {
              continue;
            }

            const score = clampScore(Number(attempt.score));
            const quizType = quizSet.quiz_type?.toUpperCase();

            if (quizType === 'CORE') {
              coreQuizScore = Math.max(coreQuizScore, score);
              continue;
            }

            if (quizType === 'CATEGORY' && quizSet.category_id) {
              const currentScore =
                categoryQuizScores[quizSet.category_id];

              if (currentScore === undefined || score > currentScore) {
                categoryQuizScores[quizSet.category_id] = score;
              }
            }
          }

          const activeCategoryScores = sitterCategories
            .map((categoryId) => categoryQuizScores[categoryId])
            .filter(
              (score): score is number =>
                typeof score === 'number' && Number.isFinite(score)
            );

          const quizScore = calculateCombinedQuizScore(
            coreQuizScore,
            activeCategoryScores
          );

          const isNewSitter = reviewCount === 0;

          const recommendationScore = calculateRecommendationScore({
            reviewScore,
            quizScore,
            experienceScore,
            isNewSitter,
          });

          /* ===============================================
           * AVATAR
           * ============================================= */

          const avatarUrl =
            getAvatarUrl(
              profile?.avatar_url
            );

          /* ===============================================
           * RETURN
           * ============================================= */

          return {
            sitterProfileId:
              sitter.id,

            userId:
              sitter.user_id,

            displayName:
              getDisplayName(
                profile
              ),

            avatarUrl,

            bio:
              profile?.bio ??
              null,

            province:
              location
                ?.province ??
              '',

            district:
              location
                ?.district ??
              '',

            area:
              location
                ?.area ??
              '',

            houseType:
              sitter.house_type,

            specialty:
              sitter.specialty,

            experienceYears,

            startingPrice,

            isVerified:
              sitter.is_verified,

            isAvailable:
              sitter.is_available,

            categories:
              sitterCategories,

            averageRating,

            reviewCount,

            reviewScore,

            experienceScore,

            coreQuizScore: roundScore(coreQuizScore),

            categoryQuizScores,

            quizScore,

            recommendationScore,

            isNewSitter,
          };
        }
      );

    /* =====================================================
     * FINAL DEBUG
     * =================================================== */

    console.log(
      'SITTER SEARCH RESULT:',
      results.map(
        (
          sitter
        ) => ({
          sitterProfileId:
            sitter.sitterProfileId,

          userId:
            sitter.userId,

          name:
            sitter.displayName,

          avatarUrl:
            sitter.avatarUrl,

          categories:
            sitter.categories,

          price:
            sitter.startingPrice,

          rating:
            sitter.averageRating,

          reviews:
            sitter.reviewCount,

          coreQuiz:
            sitter.coreQuizScore,

          categoryQuiz:
            sitter.categoryQuizScores,

          quizScore:
            sitter.quizScore,

          experienceScore:
            sitter.experienceScore,

          recommendation:
            sitter.recommendationScore,

          newSitter:
            sitter.isNewSitter,
        })
      )
    );

    const sortedResults = [...results].sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }

      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }

      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }

      return b.experienceYears - a.experienceYears;
    });

    return sortedResults;
  },
};