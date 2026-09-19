/* eslint-disable @next/next/no-img-element */

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  PawPrint,
  UserRound,
  X,
} from 'lucide-react';

import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth';
import { BookingService } from '@/lib/supabase/bookingService';

/* =========================================================
 * TYPES
 * ======================================================= */

interface PetRow {
  id: string;
  owner_id: string;
  name: string;
  category_id: string;
  breed: string | null;
  gender: string | null;
  photo_url: string | null;
  is_active: boolean;
}

interface ServiceRow {
  id: string;
  sitter_id: string;
  category_id: string;
  service_name: string;
  description: string | null;
  price: number | string;
  price_unit: string;
  is_active: boolean;
}

interface SitterProfileRow {
  id: string;
  user_id: string;
  is_verified: boolean;
  is_available: boolean;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function getTodayString() {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}

/*
 * ปัจจุบันคิดแบบ inclusive
 * เช่น 1 - 1 = 1 วัน
 *     1 - 2 = 2 วัน
 */
function calculateDays(
  startDate: string,
  endDate: string
) {
  if (
    !startDate ||
    !endDate
  ) {
    return 0;
  }

  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return 0;
  }

  const difference =
    end.getTime() -
    start.getTime();

  if (
    difference < 0
  ) {
    return 0;
  }

  return (
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

function getCategoryLabel(
  categoryId: string
) {
  switch (categoryId) {
    case 'CANINE_FELINE':
      return 'สุนัขและแมว';

    case 'SMALL_MAMMALS':
      return 'สัตว์เลี้ยงขนาดเล็ก';

    case 'REPTILES_AMPHIBIANS_AQUATICS':
      return 'สัตว์เลื้อยคลาน สัตว์สะเทินน้ำสะเทินบก และสัตว์น้ำ';

    case 'ORNAMENTAL_BIRDS_AVIANS':
      return 'นกสวยงามและสัตว์ปีก';

    default:
      return categoryId;
  }
}

function getDisplayName(
  profile: ProfileRow | null
) {
  if (
    profile
      ?.display_name
      ?.trim()
  ) {
    return profile.display_name.trim();
  }

  const fullName = [
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

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    'th-TH',
    {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }
  ).format(value);
}

function getPriceUnitLabel(
  priceUnit: string
) {
  if (
    priceUnit ===
    'NIGHT'
  ) {
    return 'บาท / คืน';
  }

  return 'บาท / วัน';
}

function getSummaryRateLabel(
  priceUnit: string
) {
  if (
    priceUnit ===
    'NIGHT'
  ) {
    return 'ราคาต่อคืน';
  }

  return 'ราคาต่อวัน';
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function OwnerBookPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  /*
   * Route:
   * /owner/book/[sitterId]
   */

  const sitterId =
    typeof params.sitterId ===
    'string'
      ? params.sitterId
      : '';

  const serviceId =
    searchParams.get(
      'service'
    ) ?? '';

  /* =======================================================
   * STATE
   * ===================================================== */

  const [
    ownerId,
    setOwnerId,
  ] = useState('');

  const [
    sitter,
    setSitter,
  ] =
    useState<SitterProfileRow | null>(
      null
    );

  const [
    sitterUser,
    setSitterUser,
  ] =
    useState<ProfileRow | null>(
      null
    );

  const [
    service,
    setService,
  ] =
    useState<ServiceRow | null>(
      null
    );

  const [
    pets,
    setPets,
  ] = useState<PetRow[]>([]);

  const [
    selectedPetId,
    setSelectedPetId,
  ] = useState('');

  const [
    startDate,
    setStartDate,
  ] = useState('');

  const [
    endDate,
    setEndDate,
  ] = useState('');

  const [
    ownerNote,
    setOwnerNote,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    bookingCreated,
    setBookingCreated,
  ] = useState(false);

  /* =======================================================
   * TOAST
   * ===================================================== */

  const toastTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const redirectTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const clearToastTimer =
    useCallback(() => {
      if (
        toastTimerRef.current
      ) {
        clearTimeout(
          toastTimerRef.current
        );

        toastTimerRef.current =
          null;
      }
    }, []);

  const showSuccess =
    useCallback(
      (
        text: string
      ) => {
        clearToastTimer();

        setError('');
        setSuccessMessage(
          text
        );

        toastTimerRef.current =
          setTimeout(() => {
            setSuccessMessage(
              ''
            );

            toastTimerRef.current =
              null;
          }, 4000);
      },
      [clearToastTimer]
    );

  const showError =
    useCallback(
      (
        text: string
      ) => {
        clearToastTimer();

        setSuccessMessage(
          ''
        );

        setError(
          text
        );

        toastTimerRef.current =
          setTimeout(() => {
            setError('');

            toastTimerRef.current =
              null;
          }, 5500);
      },
      [clearToastTimer]
    );

  useEffect(() => {
    return () => {
      clearToastTimer();

      if (
        redirectTimerRef.current
      ) {
        clearTimeout(
          redirectTimerRef.current
        );
      }
    };
  }, [clearToastTimer]);

  /* =======================================================
   * LOAD PAGE
   * ===================================================== */

  useEffect(() => {
    const loadPage =
      async () => {
        try {
          setLoading(
            true
          );

          setError('');

          /* AUTH */

          const current =
            await AuthService.getCurrentProfile();

          if (!current) {
            router.replace(
              '/login'
            );

            return;
          }

          if (
            current.role
              .trim()
              .toUpperCase() !==
            'OWNER'
          ) {
            router.replace(
              '/'
            );

            return;
          }

          setOwnerId(
            current.id
          );

          if (!sitterId) {
            throw new Error(
              'ไม่พบข้อมูล Sitter'
            );
          }

          if (!serviceId) {
            throw new Error(
              'ไม่พบบริการที่เลือก'
            );
          }

          /* ===============================================
           * SITTER
           * ============================================= */

          const {
            data: sitterData,
            error: sitterError,
          } = await supabase
            .from(
              'sitter_profiles'
            )
            .select(`
              id,
              user_id,
              is_verified,
              is_available
            `)
            .eq(
              'id',
              sitterId
            )
            .maybeSingle();

          if (
            sitterError
          ) {
            throw new Error(
              sitterError.message
            );
          }

          if (
            !sitterData
          ) {
            throw new Error(
              'ไม่พบผู้รับฝาก'
            );
          }

          const sitterRow =
            sitterData as SitterProfileRow;

          if (
            !sitterRow.is_verified
          ) {
            throw new Error(
              'Sitter รายนี้ยังไม่ได้รับการรับรอง'
            );
          }

          if (
            !sitterRow.is_available
          ) {
            throw new Error(
              'Sitter รายนี้ยังไม่พร้อมรับฝาก'
            );
          }

          setSitter(
            sitterRow
          );

          /* ===============================================
           * SITTER USER PROFILE
           * ============================================= */

          const {
            data: sitterUserData,
            error: sitterUserError,
          } = await supabase
            .from(
              'profiles'
            )
            .select(`
              id,
              display_name,
              first_name,
              last_name,
              avatar_url
            `)
            .eq(
              'id',
              sitterRow.user_id
            )
            .maybeSingle();

          if (
            sitterUserError
          ) {
            throw new Error(
              sitterUserError.message
            );
          }

          setSitterUser(
            sitterUserData as
              | ProfileRow
              | null
          );

          /* ===============================================
           * SERVICE
           * ============================================= */

          const {
            data: serviceData,
            error: serviceError,
          } = await supabase
            .from(
              'sitter_services'
            )
            .select(`
              id,
              sitter_id,
              category_id,
              service_name,
              description,
              price,
              price_unit,
              is_active
            `)
            .eq(
              'id',
              serviceId
            )
            .eq(
              'sitter_id',
              sitterId
            )
            .eq(
              'is_active',
              true
            )
            .maybeSingle();

          if (
            serviceError
          ) {
            throw new Error(
              serviceError.message
            );
          }

          if (
            !serviceData
          ) {
            throw new Error(
              'ไม่พบบริการที่เลือก หรือบริการนี้ถูกปิดแล้ว'
            );
          }

          const serviceRow =
            serviceData as ServiceRow;

          setService(
            serviceRow
          );

          /* ===============================================
           * OWNER PETS
           * ============================================= */

          const {
            data: petData,
            error: petError,
          } = await supabase
            .from(
              'pets'
            )
            .select(`
              id,
              owner_id,
              name,
              category_id,
              breed,
              gender,
              photo_url,
              is_active
            `)
            .eq(
              'owner_id',
              current.id
            )
            .eq(
              'is_active',
              true
            )
            .eq(
              'category_id',
              serviceRow.category_id
            )
            .order(
              'created_at',
              {
                ascending:
                  true,
              }
            );

          if (
            petError
          ) {
            throw new Error(
              petError.message
            );
          }

          const petRows =
            (petData ??
              []) as PetRow[];

          setPets(
            petRows
          );

          if (
            petRows.length ===
            1
          ) {
            setSelectedPetId(
              petRows[0].id
            );
          }
        } catch (err) {
          console.error(
            'LOAD OWNER BOOK PAGE ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูลการจองได้'
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    void loadPage();
  }, [
    router,
    serviceId,
    sitterId,
  ]);

  /* =======================================================
   * COMPUTED
   * ===================================================== */

  const selectedPet =
    useMemo(() => {
      return (
        pets.find(
          (pet) =>
            pet.id ===
            selectedPetId
        ) ?? null
      );
    }, [
      pets,
      selectedPetId,
    ]);

  const numberOfDays =
    useMemo(() => {
      return calculateDays(
        startDate,
        endDate
      );
    }, [
      startDate,
      endDate,
    ]);

  const dailyRate =
    service
      ? Number(
          service.price
        )
      : 0;

  const totalPrice =
    numberOfDays *
    dailyRate;

  const today =
    getTodayString();

  /* =======================================================
   * CREATE BOOKING
   * ===================================================== */

  const handleSubmit =
    async () => {
      /*
       * ป้องกัน double click
       */

      if (
        submitting ||
        bookingCreated
      ) {
        return;
      }

      if (
        !ownerId ||
        !sitter ||
        !service
      ) {
        showError(
          'ข้อมูลการจองไม่ครบถ้วน'
        );

        return;
      }

      if (
        !selectedPetId
      ) {
        showError(
          'กรุณาเลือกสัตว์เลี้ยง'
        );

        return;
      }

      if (
        !startDate
      ) {
        showError(
          'กรุณาเลือกวันที่เริ่มฝาก'
        );

        return;
      }

      if (
        !endDate
      ) {
        showError(
          'กรุณาเลือกวันที่รับกลับ'
        );

        return;
      }

      if (
        startDate <
        today
      ) {
        showError(
          'วันที่เริ่มฝากต้องไม่เป็นวันที่ผ่านมาแล้ว'
        );

        return;
      }

      if (
        endDate <
        startDate
      ) {
        showError(
          'วันที่รับกลับต้องไม่น้อยกว่าวันที่เริ่มฝาก'
        );

        return;
      }

      if (
        numberOfDays <=
        0
      ) {
        showError(
          'ช่วงวันที่ไม่ถูกต้อง'
        );

        return;
      }

      if (
        !selectedPet
      ) {
        showError(
          'ไม่พบข้อมูลสัตว์เลี้ยง'
        );

        return;
      }

      if (
        selectedPet.owner_id !==
        ownerId
      ) {
        showError(
          'สัตว์เลี้ยงที่เลือกไม่ใช่ของบัญชีนี้'
        );

        return;
      }

      if (
        selectedPet.category_id !==
        service.category_id
      ) {
        showError(
          'ประเภทสัตว์ไม่ตรงกับบริการที่เลือก'
        );

        return;
      }

      if (
        !Number.isFinite(
          dailyRate
        ) ||
        dailyRate <= 0
      ) {
        showError(
          'ราคาบริการไม่ถูกต้อง'
        );

        return;
      }

      if (
        !Number.isFinite(
          totalPrice
        ) ||
        totalPrice <= 0
      ) {
        showError(
          'ยอดรวมการจองไม่ถูกต้อง'
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        clearToastTimer();

        setError('');
        setSuccessMessage(
          ''
        );

        /*
         * ใช้ BookingService
         * แทน insert ตรงในหน้า
         */

        await BookingService.createBooking({
          ownerId,

          sitterId:
            sitter.id,

          petId:
            selectedPet.id,

          serviceId:
            service.id,

          startDate,

          endDate,

          dailyRate,

          totalPrice,

          ownerNote:
            ownerNote.trim() ||
            undefined,

          petCount:
            1,
        });

        setBookingCreated(
          true
        );

        showSuccess(
          'ส่งคำขอจองเรียบร้อยแล้ว กำลังพาไปหน้ารายการจอง'
        );

        /*
         * รอให้ User เห็น Toast ก่อน redirect
         */

        redirectTimerRef.current =
          setTimeout(() => {
            router.push(
              '/owner/bookings'
            );
          }, 1500);
      } catch (err) {
        console.error(
          'CREATE BOOKING ERROR:',
          err
        );

        showError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถยืนยันการจองได้'
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <ToastNotification
          message={
            successMessage
          }
          error={
            error
          }
          onCloseMessage={() => {
            clearToastTimer();

            setSuccessMessage(
              ''
            );
          }}
          onCloseError={() => {
            clearToastTimer();

            setError('');
          }}
        />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-105 flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

            <p className="text-sm text-slate-400">
              กำลังเตรียมข้อมูลการจอง...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
   * LOAD ERROR
   * ===================================================== */

  if (
    error &&
    (
      !service ||
      !sitter
    )
  ) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <ToastNotification
          message=""
          error={
            error
          }
          onCloseMessage={() => {}}
          onCloseError={() => {
            clearToastTimer();

            setError('');
          }}
        />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/owner/search"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 transition hover:text-purple-900"
          >
            <ArrowLeft className="h-4 w-4" />

            กลับไปค้นหาผู้รับฝาก
          </Link>

          <section className="mt-5 rounded-[28px] border border-rose-100 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />

            <h1 className="mt-4 text-lg font-black text-purple-950">
              ไม่สามารถทำการจองได้
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (
    !sitter ||
    !service
  ) {
    return null;
  }

  const sitterName =
    getDisplayName(
      sitterUser
    );

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      {/* ===================================================
       * TOAST
       * ================================================= */}

      <ToastNotification
        message={
          successMessage
        }
        error={
          error
        }
        onCloseMessage={() => {
          clearToastTimer();

          setSuccessMessage(
            ''
          );
        }}
        onCloseError={() => {
          clearToastTimer();

          setError('');
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        {/* BACK */}

        <Link
          href={`/owner/search/${sitter.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 transition hover:text-purple-900"
        >
          <ArrowLeft className="h-4 w-4" />

          กลับหน้าโปรไฟล์ Sitter
        </Link>

        {/* =================================================
         * HEADER
         * =============================================== */}

        <section className="relative mt-5 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-6 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

          <div className="relative inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-purple-700">
            <CalendarDays className="h-4 w-4" />

            Booking
          </div>

          <h1 className="relative mt-3 text-2xl font-black text-purple-950 sm:text-3xl">
            จองบริการฝากสัตว์เลี้ยง
          </h1>

          <p className="relative mt-2 max-w-2xl text-sm leading-6 text-purple-900/60">
            เลือกสัตว์เลี้ยงและวันที่ต้องการฝาก
            จากนั้นตรวจสอบรายละเอียดก่อนส่งคำขอไปยัง Sitter
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* =================================================
           * LEFT
           * =============================================== */}

          <div className="space-y-5">
            {/* ===============================================
             * SITTER
             * ============================================= */}

            <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
              <h2 className="text-sm font-black text-purple-950">
                ผู้รับฝาก
              </h2>

              <div className="mt-4 flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-purple-100">
                  {sitterUser?.avatar_url ? (
                    <img
                      src={
                        sitterUser.avatar_url
                      }
                      alt={
                        sitterName
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserRound className="h-7 w-7 text-purple-400" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-black text-purple-950">
                    {sitterName}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

                    <p className="text-xs font-bold text-emerald-600">
                      พร้อมรับฝาก
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===============================================
             * SERVICE
             * ============================================= */}

            <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
              <h2 className="text-sm font-black text-purple-950">
                บริการที่เลือก
              </h2>

              <div className="mt-4 rounded-[22px] bg-[#F8F4FF] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-black text-purple-950">
                      {
                        service.service_name
                      }
                    </h3>

                    <p className="mt-1 text-xs font-bold text-purple-600">
                      {getCategoryLabel(
                        service.category_id
                      )}
                    </p>

                    {service.description && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {
                          service.description
                        }
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 sm:text-right">
                    <p className="text-lg font-black text-purple-700">
                      {formatCurrency(
                        dailyRate
                      )}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      {getPriceUnitLabel(
                        service.price_unit
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===============================================
             * PET
             * ============================================= */}

            <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
              <h2 className="text-sm font-black text-purple-950">
                เลือกสัตว์เลี้ยง
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                แสดงเฉพาะสัตว์เลี้ยงที่ตรงกับประเภทบริการ
              </p>

              {pets.length ===
              0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-purple-200 bg-purple-50/30 p-6 text-center">
                  <PawPrint className="mx-auto h-7 w-7 text-purple-300" />

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    ยังไม่มีสัตว์เลี้ยงที่ใช้บริการนี้ได้
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    กรุณาเพิ่มสัตว์ประเภท{' '}
                    <span className="font-bold text-purple-600">
                      {getCategoryLabel(
                        service.category_id
                      )}
                    </span>{' '}
                    ก่อนทำการจอง
                  </p>

                  <Link
                    href="/owner/pets"
                    className="mt-4 inline-flex rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700"
                  >
                    จัดการสัตว์เลี้ยง
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {pets.map(
                    (
                      pet
                    ) => {
                      const selected =
                        pet.id ===
                        selectedPetId;

                      return (
                        <button
                          key={
                            pet.id
                          }
                          type="button"
                          disabled={
                            bookingCreated
                          }
                          onClick={() =>
                            setSelectedPetId(
                              pet.id
                            )
                          }
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            selected
                              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                              : 'border-slate-100 bg-white hover:border-purple-200'
                          }`}
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-purple-100">
                            {pet.photo_url ? (
                              <img
                                src={
                                  pet.photo_url
                                }
                                alt={
                                  pet.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <PawPrint className="h-5 w-5 text-purple-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-purple-950">
                              {
                                pet.name
                              }
                            </p>

                            <p className="mt-1 truncate text-[10px] text-slate-400">
                              {pet.breed ||
                                getCategoryLabel(
                                  pet.category_id
                                )}
                            </p>
                          </div>

                          {selected && (
                            <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-purple-600" />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            {/* ===============================================
             * DATES
             * ============================================= */}

            <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
              <h2 className="text-sm font-black text-purple-950">
                วันที่ฝากเลี้ยง
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    วันที่เริ่มฝาก
                  </label>

                  <input
                    type="date"
                    min={
                      today
                    }
                    disabled={
                      bookingCreated
                    }
                    value={
                      startDate
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target.value;

                      setStartDate(
                        value
                      );

                      if (
                        endDate &&
                        endDate <
                          value
                      ) {
                        setEndDate(
                          value
                        );
                      }
                    }}
                    className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    วันที่รับกลับ
                  </label>

                  <input
                    type="date"
                    min={
                      startDate ||
                      today
                    }
                    disabled={
                      bookingCreated
                    }
                    value={
                      endDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEndDate(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {numberOfDays >
                0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-xs text-purple-700">
                  <CalendarDays className="h-4 w-4" />

                  ระยะเวลาฝากทั้งหมด

                  <span className="font-black">
                    {
                      numberOfDays
                    }{' '}
                    วัน
                  </span>
                </div>
              )}
            </section>

            {/* ===============================================
             * NOTE
             * ============================================= */}

            <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
              <h2 className="text-sm font-black text-purple-950">
                หมายเหตุถึง Sitter
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                ไม่จำเป็นต้องกรอก หากไม่มีข้อมูลเพิ่มเติม
              </p>

              <textarea
                rows={5}
                maxLength={
                  1000
                }
                disabled={
                  bookingCreated
                }
                value={
                  ownerNote
                }
                onChange={(
                  event
                ) =>
                  setOwnerNote(
                    event.target.value
                  )
                }
                placeholder="เช่น น้องต้องกินยาหลังอาหาร หรือมีพฤติกรรมที่ต้องระวัง..."
                className="mt-4 w-full resize-none rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-right text-[10px] text-slate-400">
                {
                  ownerNote.length
                }
                /1000
              </p>
            </section>
          </div>

          {/* =================================================
           * SUMMARY
           * =============================================== */}

          <aside>
            <div className="sticky top-28 rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
              <h2 className="font-black text-purple-950">
                สรุปการจอง
              </h2>

              <div className="mt-5 space-y-4">
                <SummaryRow
                  label="ผู้รับฝาก"
                  value={
                    sitterName
                  }
                />

                <SummaryRow
                  label="บริการ"
                  value={
                    service.service_name
                  }
                />

                <SummaryRow
                  label="สัตว์เลี้ยง"
                  value={
                    selectedPet
                      ?.name ||
                    '-'
                  }
                />

                <SummaryRow
                  label={
                    getSummaryRateLabel(
                      service.price_unit
                    )
                  }
                  value={
                    formatCurrency(
                      dailyRate
                    )
                  }
                />

                <SummaryRow
                  label="ระยะเวลา"
                  value={
                    numberOfDays >
                    0
                      ? `${numberOfDays} วัน`
                      : '-'
                  }
                />

                <SummaryRow
                  label="วันที่เริ่ม"
                  value={
                    startDate ||
                    '-'
                  }
                />

                <SummaryRow
                  label="วันที่รับกลับ"
                  value={
                    endDate ||
                    '-'
                  }
                />

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-600">
                      ยอดรวม
                    </span>

                    <span className="text-2xl font-black text-purple-700">
                      {formatCurrency(
                        totalPrice
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  submitting ||
                  bookingCreated ||
                  pets.length ===
                    0 ||
                  !selectedPetId ||
                  !startDate ||
                  !endDate ||
                  numberOfDays <=
                    0
                }
                onClick={() =>
                  void handleSubmit()
                }
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 text-sm font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    กำลังส่งคำขอ...
                  </>
                ) : bookingCreated ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />

                    ส่งคำขอแล้ว
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" />

                    ยืนยันการจอง
                  </>
                )}
              </button>

              <div className="mt-3 rounded-xl bg-purple-50/60 px-3 py-2.5">
                <p className="text-center text-[10px] leading-5 text-slate-500">
                  หลังยืนยัน คำขอจะถูกส่งไปยัง Sitter
                  และมีสถานะ{' '}
                  <span className="font-bold text-amber-600">
                    รอการตอบรับ
                  </span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
 * SUMMARY ROW
 * ======================================================= */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-xs font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
 * TOAST
 * ======================================================= */

interface ToastNotificationProps {
  message: string;
  error: string;
  onCloseMessage: () => void;
  onCloseError: () => void;
}

function ToastNotification({
  message,
  error,
  onCloseMessage,
  onCloseError,
}: ToastNotificationProps) {
  if (
    !message &&
    !error
  ) {
    return null;
  }

  return (
    <div
      className="
        pointer-events-none
        fixed
        right-4
        top-4
        z-9999
        flex
        w-[calc(100%-2rem)]
        max-w-sm
        flex-col
        gap-3
        sm:right-6
        sm:top-6
      "
      aria-live="polite"
      aria-atomic="true"
    >
      {/* SUCCESS */}

      {message && (
        <div
          className="
            pointer-events-auto
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-emerald-200
            bg-white
            p-4
            shadow-xl
          "
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-800">
              สำเร็จ
            </p>

            <p className="mt-1 wrap-break-word text-xs leading-5 text-slate-500">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onCloseMessage
            }
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div
          className="
            pointer-events-auto
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-200
            bg-white
            p-4
            shadow-xl
          "
          role="alert"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-800">
              ไม่สามารถดำเนินการได้
            </p>

            <p className="mt-1 wrap-break-word text-xs leading-5 text-slate-500">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onCloseError
            }
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
