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
  Star,
  UserRound,
} from 'lucide-react';

import {
  SitterSearchService,
  type SitterSearchResult,
} from '@/lib/supabase/sitterSearchService';

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
    const loadSitters =
      async () => {
        try {
          setLoading(true);
          setError('');

          const data =
            await SitterSearchService.getSitters();

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

  const clearFilters = () => {
    setKeyword('');
    setProvince('');
    setCategory('');
  };

  const hasFilter =
    keyword.trim() !== '' ||
    province !== '' ||
    category !== '';

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-100 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-sm text-slate-400">
            กำลังโหลดผู้รับฝาก...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* SEARCH */}

      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-7">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
          <Search className="h-3.5 w-3.5" />
          Find Sitter
        </div>

        <h1 className="mt-3 text-2xl font-black text-[#2E1065] sm:text-3xl">
          ค้นหาผู้รับฝากสัตว์เลี้ยง
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          ค้นหาผู้รับฝากที่เหมาะกับสัตว์เลี้ยงของคุณ
          จากพื้นที่ ประเภทสัตว์
          และความเชี่ยวชาญ
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {/* KEYWORD */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={keyword}
              onChange={(event) =>
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
            onChange={(event) =>
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
            onChange={(event) =>
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
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              พบ{' '}
              <span className="font-bold text-purple-700">
                {filteredSitters.length}
              </span>{' '}
              รายการ
            </p>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </section>

      {/* ERROR */}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* RESULT */}

      <section className="mt-7">
        <div>
          <h2 className="text-lg font-black text-purple-950">
            ผู้รับฝากที่พร้อมให้บริการ
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            พบทั้งหมด{' '}
            {filteredSitters.length}{' '}
            รายการ
          </p>
        </div>

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
                className="mt-4 rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredSitters.map(
              (sitter) => (
                <article
                  key={
                    sitter.sitterProfileId
                  }
                  className="flex h-full flex-col rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
                >
                  {/* PROFILE */}

                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-purple-100">
                      {sitter.avatarUrl ? (
                        <img
                          src={
                            sitter.avatarUrl
                          }
                          alt={
                            sitter.displayName
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserRound className="h-8 w-8 text-purple-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate font-black text-purple-950">
                          {sitter.displayName}
                        </h3>

                        {sitter.isVerified && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-purple-600" />
                        )}
                      </div>

                      <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />

                        <span className="line-clamp-2">
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
                            ยังไม่มีคะแนน
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SPECIALTY */}

                  {sitter.specialty && (
                    <div className="mt-4 rounded-2xl bg-[#FAF8FE] px-4 py-3">
                      <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                        {sitter.specialty}
                      </p>
                    </div>
                  )}

                  {/* CATEGORIES */}

                  {sitter.categories.length >
                    0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {sitter.categories
                        .slice(0, 3)
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

                  {/* BOTTOM */}

                  <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        ราคาเริ่มต้น
                      </p>

                      <p className="text-lg font-black text-purple-700">
                        ฿
                        {sitter.startingPrice.toLocaleString(
                          'th-TH'
                        )}
                      </p>
                    </div>

                    {/* สำคัญมาก:
                        ต้องเป็น /owner/search/
                        เพราะหน้า detail อยู่ที่
                        app/owner/search/[id]/page.tsx
                    */}

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

function getCategoryLabel(
  categoryId: string
): string {
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