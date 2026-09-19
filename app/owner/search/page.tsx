/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [sitters, setSitters] = useState<SitterSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [keyword, setKeyword] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('');

  /* =======================================================
   * LOAD SITTERS
   * ===================================================== */

  useEffect(() => {
    const loadSitters = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await SitterSearchService.getSitters();

        console.log(
          'OWNER SEARCH SITTERS:',
          data.map((sitter) => ({
            sitterProfileId: sitter.sitterProfileId,
            name: sitter.displayName,
            rating: sitter.averageRating,
            reviews: sitter.reviewCount,
            completedJobs: sitter.completedJobs,
            coreQuiz: sitter.coreQuizScore,
            categoryQuiz: sitter.categoryQuizScores,
            quizScore: sitter.quizScore,
            experienceScore: sitter.experienceScore,
            recommendation: sitter.recommendationScore,
            newSitter: sitter.isNewSitter,
          }))
        );

        setSitters(data);
      } catch (err) {
        console.error('LOAD SITTER SEARCH ERROR:', err);

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

  const provinces = useMemo(() => {
    return Array.from(
      new Set(
        sitters
          .map((sitter) => sitter.province)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [sitters]);

  /* =======================================================
   * DISTRICTS
   * ===================================================== */

  const districts = useMemo(() => {
    return Array.from(
      new Set(
        sitters
          .filter(
            (sitter) =>
              !province ||
              sitter.province === province
          )
          .map((sitter) => sitter.district)
          .filter(
            (value): value is string =>
              Boolean(value)
          )
      )
    ).sort();
  }, [sitters, province]);

  useEffect(() => {
    if (
      district &&
      !districts.includes(district)
    ) {
      setDistrict('');
    }
  }, [district, districts]);

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredSitters = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    return sitters.filter((sitter) => {
      const matchesKeyword =
        !searchText ||
        sitter.displayName.toLowerCase().includes(searchText) ||
        sitter.specialty?.toLowerCase().includes(searchText) ||
        sitter.area?.toLowerCase().includes(searchText) ||
        sitter.district?.toLowerCase().includes(searchText) ||
        sitter.province?.toLowerCase().includes(searchText);

      const matchesProvince =
        !province || sitter.province === province;

      const matchesDistrict =
        !district || sitter.district === district;

      const matchesCategory =
        !category || sitter.categories.includes(category);

      return (
        matchesKeyword &&
        matchesProvince &&
        matchesDistrict &&
        matchesCategory
      );
    });
  }, [
    sitters,
    keyword,
    province,
    district,
    category,
  ]);

  /* =======================================================
   * TOP 3 RECOMMENDATION
   *
   * ตามรายงาน:
   * Review 50%
   * Completed Jobs 30%
   * Quiz 20%
   *
   * Cold Start:
   * Quiz 100%
   * ===================================================== */

  const recommendedSitters = useMemo(() => {
    return [...filteredSitters]
      .sort((a, b) => {
        const scoreA = getRecommendationScoreForSearch(
          a,
          category
        );

        const scoreB = getRecommendationScoreForSearch(
          b,
          category
        );

        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }

        if (b.completedJobs !== a.completedJobs) {
          return b.completedJobs - a.completedJobs;
        }

        return b.reviewCount - a.reviewCount;
      })
      .slice(0, 3);
  }, [filteredSitters, category]);

  /* =======================================================
   * CLEAR FILTER
   * ===================================================== */

  const clearFilters = () => {
    setKeyword('');
    setProvince('');
    setDistrict('');
    setCategory('');
  };

  const hasFilter =
    keyword.trim() !== '' ||
    province !== '' ||
    district !== '' ||
    category !== '';

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-100 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-sm text-slate-400">
            กำลังโหลดผู้รับฝาก...
          </p>
        </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
      {/* SEARCH */}
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/35 blur-2xl" />
        <div className="relative inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
          <Search className="h-3.5 w-3.5" />
          Find Sitter
        </div>

        <h1 className="relative mt-3 text-2xl font-black tracking-tight text-[#2E1065] sm:text-3xl">
          ค้นหาผู้รับฝากสัตว์เลี้ยง
        </h1>

        <p className="relative mt-2 max-w-2xl text-xs font-medium leading-5 text-purple-950/60 sm:text-sm sm:leading-6">
          ค้นหาผู้รับฝากที่เหมาะกับสัตว์เลี้ยงของคุณ
          จากพื้นที่ ประเภทสัตว์ และความเชี่ยวชาญ
        </p>

        <div className="relative mt-5 grid gap-3 rounded-[24px] bg-white/75 p-3 backdrop-blur sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="ค้นหาชื่อ พื้นที่ หรือความเชี่ยวชาญ"
              className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <select
            value={province}
            onChange={(event) => {
              setProvince(event.target.value);
              setDistrict('');
            }}
            className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">ทุกจังหวัด</option>

            {provinces.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={district}
            onChange={(event) =>
              setDistrict(event.target.value)
            }
            disabled={districts.length === 0}
            className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              ทุกอำเภอ
            </option>

            {districts.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">ทุกประเภทสัตว์</option>
            <option value="CANINE_FELINE">สุนัขและแมว</option>
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
                {filteredSitters.length}
              </span>{' '}
              รายการ
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 text-xs font-bold text-purple-600 transition hover:text-purple-800"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* TOP 3 */}
      {recommendedSitters.length > 0 && (
        <section className="mt-7 rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />

              <h2 className="text-base font-black text-purple-950 sm:text-lg">
                แนะนำสำหรับคุณ
              </h2>
            </div>

            <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-xs">
              จัดอันดับจากคะแนนรีวิว จำนวนงานที่สำเร็จ
              และผลแบบทดสอบความรู้
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recommendedSitters.map((sitter, index) => (
              <RecommendedSitterCard
                key={sitter.sitterProfileId}
                sitter={sitter}
                rank={index + 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* ALL RESULTS */}
      <section className="mt-8">
        <div>
          <h2 className="text-lg font-black text-purple-950">
            ผู้รับฝากที่พร้อมให้บริการ
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            พบทั้งหมด {filteredSitters.length} รายการ
          </p>
        </div>

        {filteredSitters.length === 0 ? (
          <div className="mt-5 flex min-h-65 flex-col items-center justify-center rounded-[28px] bg-white px-5 text-center shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
            <Search className="h-8 w-8 text-purple-200" />

            <h3 className="mt-4 text-sm font-black text-slate-700">
              ไม่พบผู้รับฝาก
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              ลองเปลี่ยนคำค้นหา จังหวัด อำเภอ หรือประเภทสัตว์
            </p>

            {hasFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-2xl bg-[#7C3AED] px-5 py-2.5 text-xs font-black text-white transition hover:bg-purple-700"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSitters.map((sitter) => (
              <article
                key={sitter.sitterProfileId}
                className="flex h-full min-w-0 flex-col rounded-[26px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(76,29,149,0.09)]"
              >
                <div className="flex gap-4">
                  <SitterAvatar
                    src={sitter.avatarUrl}
                    name={sitter.displayName}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <h3 className="truncate font-black text-purple-950">
                        {sitter.displayName}
                      </h3>

                      {sitter.isVerified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-purple-600" />
                      )}
                    </div>

                    {sitter.isNewSitter && (
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                          <Sparkles className="h-3 w-3" />
                          ผู้รับฝากหน้าใหม่
                        </span>
                      </div>
                    )}

                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />

                      <span className="line-clamp-2">
                        {[
                          sitter.area,
                          sitter.district,
                          sitter.province,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'ยังไม่ได้ระบุพื้นที่'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" />

                      {sitter.reviewCount > 0 ? (
                        <>
                          <span className="text-xs font-black text-slate-700">
                            {sitter.averageRating.toFixed(1)}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            ({sitter.reviewCount} รีวิว)
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

                {sitter.specialty && (
                  <div className="mt-4 rounded-[18px] bg-[#F8F4FF] px-4 py-3">
                    <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                      {sitter.specialty}
                    </p>
                  </div>
                )}

                {sitter.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {sitter.categories
                      .slice(0, 3)
                      .map((categoryId) => (
                        <span
                          key={categoryId}
                          className="rounded-full bg-purple-50 px-2.5 py-1.5 text-[9px] font-bold text-purple-700"
                        >
                          {getCategoryLabel(categoryId)}
                        </span>
                      ))}
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400">
                      ราคาเริ่มต้น
                    </p>

                    <p className="truncate text-lg font-black text-purple-700">
                      ฿{sitter.startingPrice.toLocaleString('th-TH')}
                    </p>
                  </div>

                  <Link
                    href={`/owner/search/${sitter.sitterProfileId}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-xs font-black text-white shadow-[0_7px_16px_rgba(124,58,237,0.18)] transition hover:bg-purple-700"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      </div>
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
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <Link
      href={`/owner/search/${sitter.sitterProfileId}`}
      className="group block h-full"
    >
      <article className="flex h-full min-w-0 flex-col rounded-[22px] bg-[#FBF9FE] p-4 transition hover:-translate-y-0.5 hover:bg-purple-50/80">
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
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-sm font-black text-purple-950">
                {sitter.displayName}
              </h3>

              {sitter.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-purple-600" />
              )}
            </div>

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

            <div className="mt-1.5 flex items-start gap-1 text-[10px] text-slate-400">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-purple-400" />

              <span className="line-clamp-1">
                {[
                  sitter.area,
                  sitter.district,
                  sitter.province,
                ]
                  .filter(Boolean)
                  .join(', ') || 'ยังไม่ได้ระบุพื้นที่'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {sitter.isNewSitter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
              <Sparkles className="h-2.5 w-2.5" />
              ผู้รับฝากหน้าใหม่
            </span>
          )}

          {sitter.categories.slice(0, 1).map((categoryId) => (
            <span
              key={categoryId}
              className="rounded-full bg-purple-50 px-2.5 py-1 text-[9px] font-bold text-purple-700"
            >
              {getCategoryLabel(categoryId)}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              ราคาเริ่มต้น
            </p>

            <p className="truncate text-lg font-black text-purple-700">
              ฿{sitter.startingPrice.toLocaleString('th-TH')}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-xs font-black text-white transition group-hover:bg-purple-700">
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
  src: string | null;
  name: string;
  compact?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const showImage = Boolean(src) && !imageError;

  const sizeClass = compact
    ? 'h-14 w-14 rounded-[18px]'
    : 'h-20 w-20 rounded-[22px]';

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden border border-purple-100 bg-purple-50`}
    >
      {showImage ? (
        <img
          src={src ?? ''}
          alt={`รูปโปรไฟล์ ${name}`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => {
            console.error('SITTER AVATAR LOAD ERROR:', {
              name,
              src,
            });

            setImageError(true);
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

function getCategoryLabel(categoryId: string): string {
  switch (categoryId) {
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
 *
 * สูตรตามรายงาน:
 * Review 50%
 * Completed Jobs 30%
 * Quiz 20%
 *
 * Cold Start:
 * Quiz 100%
 * ======================================================= */

function getRecommendationScoreForSearch(
  sitter: SitterSearchResult,
  selectedCategory: string
): number {
  /*
   * ถ้า Owner ไม่ได้เลือก Category
   * ใช้คะแนนที่ Service คำนวณไว้แล้ว
   */
  if (!selectedCategory) {
    return sitter.recommendationScore;
  }

  /*
   * ถ้าเลือก Category
   * ใช้คะแนน Quiz ของ Category นั้นโดยเฉพาะ
   */
  const categoryScore =
    sitter.categoryQuizScores[selectedCategory];

  if (
    typeof categoryScore !== 'number' ||
    !Number.isFinite(categoryScore)
  ) {
    return sitter.recommendationScore;
  }

  const coreScore = Number.isFinite(sitter.coreQuizScore)
    ? sitter.coreQuizScore
    : 0;

  /*
   * คะแนน Quiz สำหรับ Category ที่เลือก
   * = ค่าเฉลี่ย Core Quiz + Category Quiz
   */
  const quizScore =
    coreScore > 0
      ? (coreScore + categoryScore) / 2
      : categoryScore;

  /*
   * Cold Start ตามรายงาน:
   * ยังไม่มี Review และยังไม่มี Completed Job
   * ใช้ Quiz 100%
   */
  if (sitter.isNewSitter) {
    return roundRecommendation(quizScore);
  }

  /*
   * สูตรปกติตามรายงาน:
   * Review 50%
   * Completed Jobs 30%
   * Quiz 20%
   */
  return roundRecommendation(
    sitter.reviewScore * 0.5 +
      sitter.experienceScore * 0.3 +
      quizScore * 0.2
  );
}

function roundRecommendation(value: number): number {
  return Number(value.toFixed(1));
}
