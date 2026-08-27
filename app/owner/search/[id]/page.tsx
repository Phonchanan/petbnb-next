 
 
/* eslint-disable @next/next/no-img-element */

'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
  MapPin,
  PawPrint,
  Star,
  UserRound,
} from 'lucide-react';

import {
  useParams,
} from 'next/navigation';

import {
  SitterDetailService,
  type SitterDetail,
  type SitterServiceItem,
} from '@/lib/supabase/sitterDetailService';

import {
  SitterPlaceImageService,
  type SitterPlaceImage,
} from '@/lib/supabase/sitterPlaceImageService';

export default function OwnerSitterDetailPage() {
  const params =
    useParams();

  const sitterId =
    typeof params.id ===
    'string'
      ? params.id
      : '';

  const [
    sitter,
    setSitter,
  ] =
    useState<SitterDetail | null>(
      null
    );

  const [
    placeImages,
    setPlaceImages,
  ] =
    useState<
      SitterPlaceImage[]
    >([]);

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /* =======================================================
   * LOAD
   * ===================================================== */

  useEffect(() => {
    const loadSitter =
      async () => {
        if (!sitterId) {
          return;
        }

        try {
          setLoading(true);
          setError('');

          const data =
            await SitterDetailService.getById(
              sitterId
            );

          setSitter(data);

          if (data) {
            try {
              const images =
                await SitterPlaceImageService.getImages(
                  data.sitterProfileId
                );

              setPlaceImages(
                images
              );

              setSelectedImageIndex(
                0
              );
            } catch (
              imageError
            ) {
              console.error(
                'LOAD SITTER PLACE IMAGES ERROR:',
                imageError
              );

              setPlaceImages(
                []
              );
            }
          }
        } catch (err) {
          console.error(
            'LOAD SITTER DETAIL ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูลผู้รับฝากได้'
          );
        } finally {
          setLoading(false);
        }
      };

    void loadSitter();
  }, [sitterId]);

  /* =======================================================
   * GALLERY
   * ===================================================== */

  const handlePreviousImage =
    () => {
      if (
        placeImages.length <=
        1
      ) {
        return;
      }

      setSelectedImageIndex(
        (current) =>
          current === 0
            ? placeImages.length -
              1
            : current - 1
      );
    };

  const handleNextImage =
    () => {
      if (
        placeImages.length <=
        1
      ) {
        return;
      }

      setSelectedImageIndex(
        (current) =>
          current ===
          placeImages.length -
            1
            ? 0
            : current + 1
      );
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex min-h-100 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดข้อมูลผู้รับฝาก...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
   * ERROR
   * ===================================================== */

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href="/owner/search"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />

          กลับไปค้นหา
        </Link>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      </main>
    );
  }

  /* =======================================================
   * NOT FOUND
   * ===================================================== */

  if (!sitter) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href="/owner/search"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />

          กลับไปค้นหา
        </Link>

        <div className="rounded-[30px] border border-dashed border-purple-200 bg-white p-12 text-center">
          ไม่พบข้อมูลผู้รับฝาก
        </div>
      </main>
    );
  }

  const selectedImage =
    placeImages[
      selectedImageIndex
    ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* BACK */}

      <Link
        href="/owner/search"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 transition hover:text-purple-900"
      >
        <ArrowLeft className="h-4 w-4" />

        กลับไปค้นหาผู้รับฝาก
      </Link>

      {/* =================================================
          PROFILE
      ================================================= */}

      <section className="overflow-hidden rounded-[30px] border border-purple-100 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* AVATAR */}

            <div className="h-36 w-36 shrink-0 overflow-hidden rounded-[28px] bg-purple-100">
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
                <div className="flex h-full w-full items-center justify-center text-purple-400">
                  <UserRound className="h-14 w-14" />
                </div>
              )}
            </div>

            {/* INFO */}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-purple-950">
                  {
                    sitter.displayName
                  }
                </h1>

                {sitter.isVerified && (
                  <BadgeCheck className="h-5 w-5 text-purple-600" />
                )}
              </div>

              {/* LOCATION */}

              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-4 w-4 shrink-0 text-purple-500" />

                {[
                  sitter.area,
                  sitter.district,
                  sitter.province,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                  'ยังไม่ได้ระบุพื้นที่'}
              </div>

              {/* BADGES */}

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>
                  ประสบการณ์{' '}
                  {
                    sitter.experienceYears
                  }{' '}
                  ปี
                </Badge>

                {sitter.houseType && (
                  <Badge>
                    <Home className="mr-1 inline h-3 w-3" />

                    {getHouseTypeLabel(
                      sitter.houseType
                    )}
                  </Badge>
                )}

                <Badge>
                  {sitter.isAvailable
                    ? 'พร้อมรับฝาก'
                    : 'ไม่พร้อมรับฝาก'}
                </Badge>
              </div>

              {/* RATING */}

              <div className="mt-4 flex items-center gap-2">
                <Star className="h-4 w-4 fill-current text-amber-500" />

                <span className="text-sm font-black text-purple-950">
                  {sitter.reviewCount >
                  0
                    ? sitter.averageRating.toFixed(
                        1
                      )
                    : 'ยังไม่มีคะแนน'}
                </span>

                {sitter.reviewCount >
                  0 && (
                  <span className="text-xs text-slate-400">
                    (
                    {
                      sitter.reviewCount
                    }{' '}
                    รีวิว)
                  </span>
                )}
              </div>

              {/* BIO */}

              {sitter.bio && (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
                  {sitter.bio}
                </p>
              )}

              {/* SPECIALTY */}

              {sitter.specialty && (
                <div className="mt-4 rounded-2xl bg-purple-50 p-4">
                  <p className="text-xs font-bold text-purple-700">
                    ความเชี่ยวชาญ
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {
                      sitter.specialty
                    }
                  </p>
                </div>
              )}
            </div>

            {/* PRICE */}

            <div className="h-fit rounded-3xl bg-[#FAF7FE] p-5 md:w-56">
              <p className="text-xs text-slate-400">
                ราคาเริ่มต้น
              </p>

              <p className="mt-1 text-2xl font-black text-purple-700">
                ฿
                {sitter.startingPrice.toLocaleString(
                  'th-TH'
                )}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                ราคาจริงขึ้นอยู่กับบริการ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          PLACE IMAGES
      ================================================= */}

      <section className="mt-6 overflow-hidden rounded-[30px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Camera className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-lg font-black text-purple-950">
                สถานที่รับฝาก
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                รูปสถานที่จริงจากผู้รับฝาก
              </p>
            </div>
          </div>

          {placeImages.length >
            0 && (
            <span className="rounded-full bg-purple-50 px-3 py-1.5 text-[10px] font-bold text-purple-600">
              {
                placeImages.length
              }{' '}
              รูป
            </span>
          )}
        </div>

        {placeImages.length >
        0 &&
        selectedImage ? (
          <div className="mt-5">
            {/* MAIN IMAGE */}

            <div className="relative overflow-hidden rounded-[26px] bg-slate-100">
              <div className="relative aspect-16/8 w-full sm:aspect-16/7 lg:aspect-16/6">
                <img
                  src={
                    selectedImage.imageUrl
                  }
                  alt={`สถานที่รับฝาก ${
                    selectedImageIndex +
                    1
                  }`}
                  className="h-full w-full object-cover"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/30 to-transparent" />

                <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                  {selectedImageIndex +
                    1}{' '}
                  /{' '}
                  {
                    placeImages.length
                  }
                </div>

                {placeImages.length >
                  1 && (
                  <>
                    <button
                      type="button"
                      onClick={
                        handlePreviousImage
                      }
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md"
                      aria-label="รูปก่อนหน้า"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleNextImage
                      }
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md"
                      aria-label="รูปถัดไป"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* THUMBNAILS */}

            {placeImages.length >
              1 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {placeImages.map(
                  (
                    image,
                    index
                  ) => {
                    const active =
                      selectedImageIndex ===
                      index;

                    return (
                      <button
                        key={
                          image.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex(
                            index
                          )
                        }
                        className={`overflow-hidden rounded-2xl border-2 transition ${
                          active
                            ? 'border-purple-600 ring-2 ring-purple-100'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="aspect-4/3">
                          <img
                            src={
                              image.imageUrl
                            }
                            alt={`รูปสถานที่ ${
                              index +
                              1
                            }`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 flex min-h-47.5 flex-col items-center justify-center rounded-[26px] border border-dashed border-purple-200 bg-purple-50/30 text-center">
            <Camera className="h-7 w-7 text-purple-300" />

            <p className="mt-3 text-sm font-bold text-slate-500">
              ยังไม่มีรูปสถานที่
            </p>

            <p className="mt-1 text-xs text-slate-400">
              ผู้รับฝากยังไม่ได้เพิ่มรูปสถานที่รับฝาก
            </p>
          </div>
        )}
      </section>

      {/* =================================================
          SERVICES + CATEGORIES
      ================================================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* SERVICES */}

        <section className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-black text-purple-950">
              บริการที่เปิดรับ
            </h2>

            <p className="text-xs text-slate-400">
              เลือกบริการเพื่อเริ่มการจอง
            </p>
          </div>

          {sitter.services.length ===
          0 ? (
            <div className="rounded-[28px] border border-dashed border-purple-200 bg-white p-10 text-center text-sm text-slate-400">
              ยังไม่มีบริการที่เปิดใช้งาน
            </div>
          ) : (
            <div className="space-y-4">
              {sitter.services.map(
                (service) => (
                  <ServiceCard
                    key={
                      service.id
                    }
                    sitterId={
                      sitter.sitterProfileId
                    }
                    service={
                      service
                    }
                    canBook={
                      sitter.isAvailable
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* CATEGORIES */}

        <section>
          <div className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
            <h2 className="font-black text-purple-950">
              ประเภทสัตว์ที่รับ
            </h2>

            {sitter.categories
              .length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {sitter.categories.map(
                  (category) => (
                    <Badge
                      key={
                        category
                      }
                    >
                      <PawPrint className="mr-1 inline h-3 w-3" />

                      {getCategoryLabel(
                        category
                      )}
                    </Badge>
                  )
                )}
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400">
                ยังไม่ได้ระบุประเภทสัตว์
              </p>
            )}
          </div>
        </section>
      </div>

      {/* =================================================
          REVIEWS
      ================================================= */}

      <section className="mt-6">
        <h2 className="text-lg font-black text-purple-950">
          รีวิวจากผู้ใช้
        </h2>

        {sitter.reviews.length ===
        0 ? (
          <div className="mt-4 rounded-[28px] border border-purple-100 bg-white p-8 text-center text-sm text-slate-400">
            ยังไม่มีรีวิว
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {sitter.reviews.map(
              (review) => (
                <article
                  key={
                    review.id
                  }
                  className="rounded-3xl border border-purple-100 bg-white p-5"
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from(
                      {
                        length:
                          review.rating,
                      },
                      (
                        _,
                        index
                      ) => (
                        <Star
                          key={
                            index
                          }
                          className="h-3.5 w-3.5 fill-current"
                        />
                      )
                    )}
                  </div>

                  {review.comment && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {
                        review.comment
                      }
                    </p>
                  )}
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
 * SERVICE CARD
 * ======================================================= */

function ServiceCard({
  sitterId,
  service,
  canBook,
}: {
  sitterId: string;
  service: SitterServiceItem;
  canBook: boolean;
}) {
  return (
    <article className="rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black text-purple-950">
            {
              service.serviceName
            }
          </h3>

          {service.description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {
                service.description
              }
            </p>
          )}

          <div className="mt-3">
            <Badge>
              {getCategoryLabel(
                service.categoryId
              )}
            </Badge>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-lg font-black text-purple-700">
            ฿
            {service.price.toLocaleString(
              'th-TH'
            )}
          </p>

          <p className="text-[10px] text-slate-400">
            {
              service.priceUnit
            }
          </p>

          {canBook ? (
            <Link
              href={`/owner/book/${sitterId}?service=${service.id}`}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-700"
            >
              <CalendarDays className="h-3.5 w-3.5" />

              จองบริการ
            </Link>
          ) : (
            <span className="mt-3 inline-flex rounded-full bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-400">
              ยังไม่พร้อมรับฝาก
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
 * BADGE
 * ======================================================= */

function Badge({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1.5 text-[10px] font-bold text-purple-700">
      {children}
    </span>
  );
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function getCategoryLabel(
  categoryId: string
) {
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

function getHouseTypeLabel(
  houseType: string
) {
  switch (
    houseType.toUpperCase()
  ) {
    case 'HOUSE':
      return 'บ้าน';

    case 'TOWNHOUSE':
      return 'ทาวน์เฮาส์';

    case 'CONDO':
      return 'คอนโด';

    case 'APARTMENT':
      return 'อพาร์ตเมนต์';

    case 'OTHER':
      return 'อื่น ๆ';

    default:
      return houseType;
  }
}