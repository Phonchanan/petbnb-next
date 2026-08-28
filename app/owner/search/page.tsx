/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  BadgeCheck,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';

import {
  SitterSearchService,
  type SitterSearchResult,
} from '@/lib/supabase/sitterSearchService';

/* =========================================================
 * PAGE
 * ======================================================= */

export default function OwnerSearchPage() {
  const [sitters, setSitters] =
    useState<SitterSearchResult[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [keyword, setKeyword] =
    useState('');

  const [province, setProvince] =
    useState('');

  const [category, setCategory] =
    useState('');

  /* =======================================================
   * LOAD SITTERS
   * ===================================================== */

  useEffect(() => {
    const loadSitters = async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await SitterSearchService.getSitters();

        console.log(
          'OWNER SEARCH SITTERS:',
          data.map(
            (sitter) => ({
              sitterProfileId:
                sitter.sitterProfileId,

              name:
                sitter.displayName,

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

        setSitters(data);
      } catch (err) {
        console.error(
          'LOAD SITTER SEARCH ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดผู้รับฝากได้'
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSitters();
  }, []);

  /* =======================================================
   * PROVINCES
   * ===================================================== */

  const provinces =
    useMemo(() => {
      return Array.from(
        new Set(
          sitters
            .map(
              (sitter) =>
                sitter.province
            )
            .filter(Boolean)
        )
      ).sort();
    }, [sitters]);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredSitters =
    useMemo(() => {
      const searchText =
        keyword
          .trim()
          .toLowerCase();

      return sitters.filter(
        (sitter) => {
          const matchesKeyword =
            !searchText ||
            sitter.displayName
              .toLowerCase()
              .includes(
                searchText
              ) ||
            sitter.specialty
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            sitter.area
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            sitter.district
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            sitter.province
              ?.toLowerCase()
              .includes(
                searchText
              );

          const matchesProvince =
            !province ||
            sitter.province ===
              province;

          const matchesCategory =
            !category ||
            sitter.categories.includes(
              category
            );

          return (
            matchesKeyword &&
            matchesProvince &&
            matchesCategory
          );
        }
      );
    }, [
      sitters,
      keyword,
      province,
      category,
    ]);

  /* =======================================================
   * RECOMMENDATION
   * ===================================================== */

  const recommendedSitters =
    useMemo(() => {
      return [...filteredSitters]
        .sort(
          (
            a,
            b
          ) => {
            const scoreA =
              getRecommendationScoreForSearch(
                a,
                category
              );

            const scoreB =
              getRecommendationScoreForSearch(
                b,
                category
              );

            if (
              scoreB !==
              scoreA
            ) {
              return (
                scoreB -
                scoreA
              );
            }

            if (
              b.averageRating !==
              a.averageRating
            ) {
              return (
                b.averageRating -
                a.averageRating
              );
            }

            if (
              b.reviewCount !==
              a.reviewCount
            ) {
              return (
                b.reviewCount -
                a.reviewCount
              );
            }

            return (
              b.experienceYears -
              a.experienceYears
            );
          }
        )
        .slice(
          0,
          3
        );
    }, [
      filteredSitters,
      category,
    ]);

  /* =======================================================
   * CLEAR FILTER
   * ===================================================== */

  const clearFilters = () => {
    setKeyword('');
    setProvince('');
    setCategory('');
  };

  const hasFilter =
    keyword.trim() !==
      '' ||
    province !==
      '' ||
    category !== '';

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-100 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-sm text-slate-400">
            กำลังโหลดผู้รับฝาก...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">

      {/* =================================================
       * SEARCH
       * =============================================== */}

      <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">

        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
          <Search className="h-3.5 w-3.5" />

          Find Sitter
        </div>

        <h1 className="mt-3 text-xl font-black text-[#2E1065] sm:text-2xl lg:text-3xl">
          ค้นหาผู้รับฝากสัตว์เลี้ยง
        </h1>

        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
          ค้นหาผู้รับฝากที่เหมาะกับสัตว์เลี้ยงของคุณ
          จากพื้นที่ ประเภทสัตว์ และความเชี่ยวชาญ
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">

          {/* KEYWORD */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={keyword}
              onChange={(
                event
              ) =>
                setKeyword(
                  event.target.value
                )
              }
              placeholder="ค้นหาชื่อ พื้นที่ หรือความเชี่ยวชาญ"
              className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* PROVINCE */}

          <select
            value={province}
            onChange={(
              event
            ) =>
              setProvince(
                event.target.value
              )
            }
            className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">
              ทุกจังหวัด
            </option>

            {provinces.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(
              event
            ) =>
              setCategory(
                event.target.value
              )
            }
            className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">
              ทุกประเภทสัตว์
            </option>

            <option value="CANINE_FELINE">
              สุนัขและแมว
            </option>

            <option value="SMALL_MAMMALS">
              สัตว์เลี้ยงลูกด้วยนมขนาดเล็ก
            </option>

            <option value="REPTILES_AMPHIBIANS_AQUATICS">
              สัตว์เลื้อยคลานและสัตว์น้ำ
            </option>

            <option value="ORNAMENTAL_BIRDS_AVIANS">
              นกและสัตว์ปีก
            </option>
          </select>
        </div>

        {hasFilter && (
          <div className="mt-4 flex items-center justify-between gap-3">

            <p className="text-xs text-slate-400">
              พบ{' '}

              <span className="font-bold text-purple-700">
                {
                  filteredSitters.length
                }
              </span>{' '}

              รายการ
            </p>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="shrink-0 text-xs font-bold text-purple-600 transition hover:text-purple-800"
            >
              ล้างตัวกรอง
            </button>

          </div>
        )}
      </section>

      {/* =================================================
       * ERROR
       * =============================================== */}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* =================================================
       * TOP 3 RECOMMENDATION
       * =============================================== */}

      {recommendedSitters.length >
        0 && (
        <section className="mt-7">

          <div className="flex items-end justify-between gap-3">

            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />

                <h2 className="text-base font-black text-purple-950 sm:text-lg">
                  แนะนำสำหรับคุณ
                </h2>
              </div>

              <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-xs">
                ผู้รับฝากที่เหมาะสมจากคะแนนรีวิว
                ประสบการณ์ และผลแบบทดสอบ
              </p>
            </div>

          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">

            {recommendedSitters.map(
              (
                sitter,
                index
              ) => (
                <RecommendedSitterCard
                  key={
                    sitter.sitterProfileId
                  }
                  sitter={
                    sitter
                  }
                  rank={
                    index + 1
                  }
                />
              )
            )}

          </div>

        </section>
      )}

      {/* =================================================
       * RESULT
       * =============================================== */}

      <section className="mt-8">

        <div>
          <h2 className="text-lg font-black text-purple-950">
            ผู้รับฝากที่พร้อมให้บริการ
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            พบทั้งหมด{' '}
            {
              filteredSitters.length
            }{' '}
            รายการ
          </p>
        </div>

        {/* =================================================
         * EMPTY
         * =============================================== */}

        {filteredSitters.length ===
        0 ? (
          <div className="mt-5 flex min-h-65 flex-col items-center justify-center rounded-[28px] border border-dashed border-purple-200 bg-white px-5 text-center">

            <Search className="h-8 w-8 text-purple-200" />

            <h3 className="mt-4 text-sm font-black text-slate-700">
              ไม่พบผู้รับฝาก
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              ลองเปลี่ยนคำค้นหา
              จังหวัด หรือประเภทสัตว์
            </p>

            {hasFilter && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-4 rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700"
              >
                ล้างตัวกรอง
              </button>
            )}

          </div>
        ) : (

          /* =================================================
           * SITTER CARDS
           * =============================================== */

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {filteredSitters.map(
              (sitter) => (
                <article
                  key={
                    sitter.sitterProfileId
                  }
                  className="flex h-full min-w-0 flex-col rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
                >

                  {/* =====================================
                   * PROFILE
                   * =================================== */}

                  <div className="flex gap-4">

                    <SitterAvatar
                      src={
                        sitter.avatarUrl
                      }
                      name={
                        sitter.displayName
                      }
                    />

                    <div className="min-w-0 flex-1">

                      {/* NAME */}

                      <div className="flex min-w-0 items-center gap-1.5">

                        <h3 className="truncate font-black text-purple-950">
                          {
                            sitter.displayName
                          }
                        </h3>

                        {sitter.isVerified && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-purple-600" />
                        )}

                      </div>

                      {/* NEW SITTER */}

                      {sitter.isNewSitter && (
                        <div className="mt-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                            <Sparkles className="h-3 w-3" />
                            ผู้รับฝากหน้าใหม่
                          </span>
                        </div>
                      )}

                      {/* LOCATION */}

                      <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">

                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />

                        <span className="line-clamp-2">
                          {[
                            sitter.area,
                            sitter.district,
                            sitter.province,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ', '
                            ) ||
                            'ยังไม่ได้ระบุพื้นที่'}
                        </span>

                      </div>

                      {/* RATING */}

                      <div className="mt-2 flex items-center gap-1.5">

                        <Star className="h-3.5 w-3.5 fill-current text-amber-500" />

                        {sitter.reviewCount >
                        0 ? (
                          <>
                            <span className="text-xs font-black text-slate-700">
                              {sitter.averageRating.toFixed(
                                1
                              )}
                            </span>

                            <span className="text-[10px] text-slate-400">
                              (
                              {
                                sitter.reviewCount
                              }{' '}
                              รีวิว)
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            ยังไม่มีรีวิว
                          </span>
                        )}

                      </div>

                    </div>
                  </div>

                  {/* =====================================
                   * SPECIALTY
                   * =================================== */}

                  {sitter.specialty && (
                    <div className="mt-4 rounded-2xl bg-[#FAF8FE] px-4 py-3">

                      <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                        {
                          sitter.specialty
                        }
                      </p>

                    </div>
                  )}

                  {/* =====================================
                   * CATEGORIES
                   * =================================== */}

                  {sitter.categories.length >
                    0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">

                      {sitter.categories
                        .slice(
                          0,
                          3
                        )
                        .map(
                          (
                            categoryId
                          ) => (
                            <span
                              key={
                                categoryId
                              }
                              className="rounded-full bg-purple-50 px-2.5 py-1.5 text-[9px] font-bold text-purple-700"
                            >
                              {getCategoryLabel(
                                categoryId
                              )}
                            </span>
                          )
                        )}

                    </div>
                  )}

                  {/* =====================================
                   * BOTTOM
                   * =================================== */}

                  <div className="mt-auto flex items-end justify-between gap-3 pt-5">

                    <div className="min-w-0">

                      <p className="text-[10px] text-slate-400">
                        ราคาเริ่มต้น
                      </p>

                      <p className="truncate text-lg font-black text-purple-700">
                        ฿
                        {sitter.startingPrice.toLocaleString(
                          'th-TH'
                        )}
                      </p>

                    </div>

                    <Link
                      href={`/owner/search/${sitter.sitterProfileId}`}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-purple-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700"
                    >
                      ดูรายละเอียด
                    </Link>

                  </div>

                </article>
              )
            )}

          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
 * RECOMMENDED SITTER CARD
 * ======================================================= */

function RecommendedSitterCard({
  sitter,
  rank,
}: {
  sitter: SitterSearchResult;
  rank: number;
}) {
  const rankLabel =
    rank === 1
      ? '🥇'
      : rank === 2
        ? '🥈'
        : '🥉';

  return (
    <Link
      href={`/owner/search/${sitter.sitterProfileId}`}
      className="group block h-full"
    >
      <article className="flex h-full min-w-0 flex-col rounded-[22px] border border-purple-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">

        {/* PROFILE */}
        <div className="flex items-start gap-3">

          <div className="relative shrink-0">
            <SitterAvatar
              src={sitter.avatarUrl}
              name={sitter.displayName}
              compact
            />

            <span className="absolute -left-1.5 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1 text-base shadow-sm">
              {rankLabel}
            </span>
          </div>

          <div className="min-w-0 flex-1">

            {/* NAME */}
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-sm font-black text-purple-950">
                {sitter.displayName}
              </h3>

              {sitter.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-purple-600" />
              )}
            </div>

            {/* RATING */}
            <div className="mt-1.5 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-amber-400" />

              {sitter.reviewCount > 0 ? (
                <>
                  <span className="text-[11px] font-black text-slate-700">
                    {sitter.averageRating.toFixed(1)}
                  </span>

                  <span className="text-[9px] text-slate-400">
                    ({sitter.reviewCount} รีวิว)
                  </span>
                </>
              ) : (
                <span className="text-[9px] text-slate-400">
                  ยังไม่มีรีวิว
                </span>
              )}
            </div>

            {/* LOCATION */}
            <div className="mt-1.5 flex items-start gap-1 text-[10px] text-slate-400">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-purple-400" />

              <span className="line-clamp-1">
                {[
                  sitter.area,
                  sitter.district,
                  sitter.province,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                  'ยังไม่ได้ระบุพื้นที่'}
              </span>
            </div>
          </div>
        </div>

        {/* BADGES */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">

          {sitter.isNewSitter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
              <Sparkles className="h-2.5 w-2.5" />
              ผู้รับฝากหน้าใหม่
            </span>
          )}

          {sitter.categories
            .slice(0, 1)
            .map((categoryId) => (
              <span
                key={categoryId}
                className="rounded-full bg-purple-50 px-2.5 py-1 text-[9px] font-bold text-purple-700"
              >
                {getCategoryLabel(categoryId)}
              </span>
            ))}
        </div>

        {/* PRICE + BUTTON */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              ราคาเริ่มต้น
            </p>

            <p className="truncate text-lg font-black text-purple-700">
              ฿
              {sitter.startingPrice.toLocaleString(
                'th-TH'
              )}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-purple-600 px-4 py-2.5 text-xs font-bold text-white transition group-hover:bg-purple-700">
            ดูรายละเอียด
          </span>

        </div>
      </article>
    </Link>
  );
}
/* =========================================================
 * SITTER AVATAR
 * ======================================================= */

function SitterAvatar({
  src,
  name,
  compact = false,
}: {
  src:
    | string
    | null;

  name: string;

  compact?: boolean;
}) {
  const [
    imageError,
    setImageError,
  ] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const showImage =
    Boolean(src) &&
    !imageError;

  const sizeClass =
    compact
      ? 'h-14 w-14 rounded-[18px]'
      : 'h-20 w-20 rounded-[22px]';

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden border border-purple-100 bg-purple-50`}
    >
      {showImage ? (
        <img
          src={
            src ?? ''
          }
          alt={`รูปโปรไฟล์ ${name}`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => {
            console.error(
              'SITTER AVATAR LOAD ERROR:',
              {
                name,
                src,
              }
            );

            setImageError(
              true
            );
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">

          <UserRound
            className={
              compact
                ? 'h-6 w-6 text-purple-400'
                : 'h-8 w-8 text-purple-400'
            }
          />

        </div>
      )}
    </div>
  );
}

/* =========================================================
 * CATEGORY LABEL
 * ======================================================= */

function getCategoryLabel(
  categoryId: string
): string {
  switch (
    categoryId
  ) {
    case 'CANINE_FELINE':
      return 'สุนัขและแมว';

    case 'SMALL_MAMMALS':
      return 'สัตว์เลี้ยงขนาดเล็ก';

    case 'REPTILES_AMPHIBIANS_AQUATICS':
      return 'สัตว์เลื้อยคลานและสัตว์น้ำ';

    case 'ORNAMENTAL_BIRDS_AVIANS':
      return 'นกและสัตว์ปีก';

    default:
      return categoryId;
  }
}

/* =========================================================
 * RECOMMENDATION FOR CURRENT SEARCH
 * ======================================================= */

/**
 * ถ้า Owner เลือกประเภทสัตว์
 * จะให้น้ำหนัก Quiz ของประเภทนั้นโดยตรง
 *
 * ถ้าไม่ได้เลือกประเภท
 * ใช้ recommendationScore ที่ Service คำนวณไว้
 */
function getRecommendationScoreForSearch(
  sitter: SitterSearchResult,
  selectedCategory: string
): number {
  if (!selectedCategory) {
    return sitter.recommendationScore;
  }

  const categoryScore =
    sitter.categoryQuizScores[
      selectedCategory
    ];

  /*
   * ถ้าไม่มี Category Quiz
   * ใช้คะแนนที่ Service คำนวณไว้เดิม
   */
  if (
    typeof categoryScore !==
      'number' ||
    !Number.isFinite(
      categoryScore
    )
  ) {
    return sitter.recommendationScore;
  }

  const coreScore =
    Number.isFinite(
      sitter.coreQuizScore
    )
      ? sitter.coreQuizScore
      : 0;

  /*
   * Quiz Score
   * Core 50% + Category 50%
   */
  const quizScore =
    coreScore > 0
      ? (
          coreScore +
          categoryScore
        ) /
        2
      : categoryScore;

  /*
   * Cold Start:
   * Quiz 70%
   * Experience 30%
   */
  if (sitter.isNewSitter) {
    return roundRecommendation(
      quizScore *
        0.7 +
        sitter.experienceScore *
          0.3
    );
  }

  /*
   * Sitter ปกติ:
   * Review 50%
   * Quiz 30%
   * Experience 20%
   */
  return roundRecommendation(
    sitter.reviewScore *
      0.5 +
      quizScore *
        0.3 +
      sitter.experienceScore *
        0.2
  );
}

function roundRecommendation(
  value: number
): number {
  return Number(
    value.toFixed(
      1
    )
  );
}