 
 
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
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <Link
        href="/owner/search"
        className="mb-5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-purple-700 transition hover:bg-purple-50 hover:text-purple-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปค้นหาผู้รับฝาก
      </Link>

      {/* =================================================
          2-COLUMN LAYOUT
      ================================================= */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* ================= LEFT ================= */}
        <div className="space-y-5">
          {/* PROFILE */}
          <section className="relative overflow-hidden rounded-[30px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-purple-100/70 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-pink-100/60 blur-3xl" />
            <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-purple-50 shadow-md ring-1 ring-purple-100 sm:mx-0 sm:h-28 sm:w-28">
                {sitter.avatarUrl ? (
                  <img
                    src={sitter.avatarUrl}
                    alt={sitter.displayName}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-purple-400">
                    <UserRound className="h-11 w-11" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="min-w-0 break-words text-xl font-black text-purple-950 sm:text-2xl">
                    {sitter.displayName}
                  </h1>

                  {sitter.isVerified && (
                    <BadgeCheck className="h-5 w-5 shrink-0 fill-purple-50 text-purple-600" />
                  )}
                </div>

                <div className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  <span>
                    {[
                      sitter.area,
                      sitter.district,
                      sitter.province,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'ยังไม่ได้ระบุพื้นที่'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {sitter.isVerified && (
                    <Badge>ยืนยันตัวตนแล้ว</Badge>
                  )}

                  <Badge>
                    {sitter.isAvailable
                      ? 'พร้อมรับฝาก'
                      : 'ไม่พร้อมรับฝาก'}
                  </Badge>

                  {sitter.houseType && (
                    <Badge>
                      <Home className="mr-1 inline h-3 w-3" />
                      {getHouseTypeLabel(sitter.houseType)}
                    </Badge>
                  )}

              
                </div>

                {/* PET CATEGORIES - moved into profile */}
                {sitter.categories.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-black tracking-wide text-slate-400">
                      ประเภทสัตว์ที่รับ
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {sitter.categories.map((category) => (
                        <Badge key={category}>
                          <PawPrint className="mr-1 inline h-3 w-3" />
                          {getCategoryLabel(category)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5">
                  <Star className="h-4 w-4 fill-current text-amber-500" />

                  {sitter.reviewCount > 0 ? (
                    <>
                      <span className="text-sm font-black text-purple-950">
                        {sitter.averageRating.toFixed(1)}
                      </span>

                      <span className="text-xs text-slate-400">
                        ({sitter.reviewCount} รีวิว)
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      ยังไม่มีรีวิว
                    </span>
                  )}
                </div>
              </div>
            </div>

            {sitter.bio && (
              <div className="mt-5 border-t border-purple-100 pt-4">
                <p className="text-xs font-bold text-purple-950">
                  เกี่ยวกับผู้รับฝาก
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {sitter.bio}
                </p>
              </div>
            )}

            {sitter.specialty && (
              <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                <p className="text-xs font-bold text-purple-700">
                  ความเชี่ยวชาญ
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {sitter.specialty}
                </p>
              </div>
            )}
            </div>
          </section>

          {/* PLACE IMAGES */}
          <section className="rounded-[30px] border border-purple-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Camera className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-base font-black text-purple-950">
                    สถานที่รับฝาก
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    รูปสถานที่จริงจากผู้รับฝาก
                  </p>
                </div>
              </div>

              {placeImages.length > 0 && (
                <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-[9px] font-bold text-purple-600">
                  {placeImages.length} รูป
                </span>
              )}
            </div>

            {placeImages.length > 0 && selectedImage ? (
              <div className="mt-4">
                <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-[#F8F7FB] shadow-inner">
                  <div className="relative h-55 w-full sm:h-72.5 lg:h-80">
                    <img
                      src={selectedImage.imageUrl}
                      alt={`สถานที่รับฝาก ${selectedImageIndex + 1}`}
                      className="h-full w-full object-contain p-2"
                    />

                    <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur">
                      {selectedImageIndex + 1} / {placeImages.length}
                    </div>

                    {placeImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePreviousImage}
                          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-purple-700 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white"
                          aria-label="รูปก่อนหน้า"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-purple-700 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white"
                          aria-label="รูปถัดไป"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="mt-4 flex min-h-45 flex-col items-center justify-center rounded-[20px] border border-dashed border-purple-200 bg-purple-50/30 px-4 text-center">
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
        </div>

        {/* ================= RIGHT ================= */}
        <div className="space-y-5">
          {/* SERVICES */}
          <section className="relative overflow-hidden rounded-[30px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-black tracking-tight text-purple-950 sm:text-lg">
                บริการที่เปิดรับ
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                เลือกบริการที่เหมาะกับสัตว์เลี้ยงของคุณเพื่อเริ่มการจอง
              </p>
            </div>

            {sitter.services.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-purple-200 bg-purple-50/20 p-8 text-center text-sm text-slate-400">
                ยังไม่มีบริการที่เปิดใช้งาน
              </div>
            ) : (
              <div className="space-y-3">
                {sitter.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    sitterId={sitter.sitterProfileId}
                    service={service}
                    canBook={sitter.isAvailable}
                  />
                ))}
              </div>
            )}
          </section>

          {/* REVIEWS */}
          <section className="relative overflow-hidden rounded-[30px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-purple-950 sm:text-lg">
                  รีวิวจากผู้ใช้
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  ประสบการณ์จากเจ้าของสัตว์เลี้ยงที่เคยใช้บริการ
                </p>
              </div>

              {sitter.reviewCount > 0 && (
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                  <span className="text-xs font-black text-amber-700">
                    {sitter.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {sitter.reviews.length === 0 ? (
              <div className="mt-4 rounded-[22px] border border-dashed border-purple-100 bg-purple-50/20 p-8 text-center text-sm text-slate-400">
                ยังไม่มีรีวิว
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {sitter.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[22px] border border-purple-100 bg-[#FCFAFF] p-4 transition hover:border-purple-200"
                  >
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from(
                        { length: review.rating },
                        (_, index) => (
                          <Star
                            key={index}
                            className="h-3.5 w-3.5 fill-current"
                          />
                        )
                      )}
                    </div>

                    {review.comment && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {review.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
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
    <article className="rounded-[22px] border border-purple-100 bg-linear-to-br from-white to-purple-50/40 p-4 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
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
    <span className="inline-flex items-center rounded-full border border-purple-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold text-purple-700 shadow-sm">
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