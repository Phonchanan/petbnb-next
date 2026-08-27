/* eslint-disable @next/next/no-img-element */

'use client';

import {
  useEffect,
  useMemo,
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
} from 'lucide-react';

import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth';

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

interface BookingInsert {
  owner_id: string;
  sitter_id: string;
  pet_id: string;
  service_id: string;

  start_date: string;
  end_date: string;

  total_price: number;
  status: 'PENDING';

  owner_note: string | null;

  daily_rate: number;
  pet_count: number;
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
      return 'สัตว์เลื้อยคลานและสัตว์น้ำ';

    case 'ORNAMENTAL_BIRDS_AVIANS':
      return 'นกและสัตว์ปีก';

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

  /* =======================================================
   * สำคัญ:
   * โฟลเดอร์คือ [sitterId]
   * ดังนั้นต้องอ่าน params.sitterId
   * ===================================================== */

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
    success,
    setSuccess,
  ] = useState(false);

  /* =======================================================
   * LOAD PAGE
   * ===================================================== */

  useEffect(() => {
    const loadPage =
      async () => {
        try {
          setLoading(true);
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
            router.replace('/');
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

          /* SITTER */

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

          if (sitterError) {
            throw new Error(
              sitterError.message
            );
          }

          if (!sitterData) {
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

          /* SITTER PROFILE */

          const {
            data: sitterUserData,
            error: sitterUserError,
          } = await supabase
            .from('profiles')
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

          /* SERVICE */

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
              'ไม่พบบริการที่เลือก'
            );
          }

          const serviceRow =
            serviceData as ServiceRow;

          setService(
            serviceRow
          );

          /* OWNER PETS */

          const {
            data: petData,
            error: petError,
          } = await supabase
            .from('pets')
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

          if (petError) {
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
          setLoading(false);
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
      if (
        !ownerId ||
        !sitter ||
        !service
      ) {
        return;
      }

      if (
        !selectedPetId
      ) {
        setError(
          'กรุณาเลือกสัตว์เลี้ยง'
        );
        return;
      }

      if (
        !startDate
      ) {
        setError(
          'กรุณาเลือกวันที่เริ่มฝาก'
        );
        return;
      }

      if (
        !endDate
      ) {
        setError(
          'กรุณาเลือกวันที่รับกลับ'
        );
        return;
      }

      if (
        endDate <
        startDate
      ) {
        setError(
          'วันที่รับกลับต้องไม่น้อยกว่าวันที่เริ่มฝาก'
        );
        return;
      }

      if (
        numberOfDays <=
        0
      ) {
        setError(
          'ช่วงวันที่ไม่ถูกต้อง'
        );
        return;
      }

      if (
        !selectedPet
      ) {
        setError(
          'ไม่พบข้อมูลสัตว์เลี้ยง'
        );
        return;
      }

      if (
        selectedPet.category_id !==
        service.category_id
      ) {
        setError(
          'ประเภทสัตว์ไม่ตรงกับบริการที่เลือก'
        );
        return;
      }

      try {
        setSubmitting(true);
        setError('');

        const payload:
          BookingInsert = {
          owner_id:
            ownerId,

          sitter_id:
            sitter.id,

          pet_id:
            selectedPet.id,

          service_id:
            service.id,

          start_date:
            startDate,

          end_date:
            endDate,

          total_price:
            totalPrice,

          status:
            'PENDING',

          owner_note:
            ownerNote.trim() ||
            null,

          daily_rate:
            dailyRate,

          pet_count:
            1,
        };

        const {
          data,
          error:
            bookingError,
        } = await supabase
          .from('bookings')
          .insert(payload)
          .select(`
            id
          `)
          .single();

        if (
          bookingError
        ) {
          console.error(
            'CREATE BOOKING ERROR:',
            bookingError
          );

          throw new Error(
            bookingError.message ||
              'ไม่สามารถสร้างการจองได้'
          );
        }

        if (!data) {
          throw new Error(
            'ไม่พบข้อมูลการจองที่สร้าง'
          );
        }

        setSuccess(true);

        window.setTimeout(
          () => {
            router.push(
              '/owner/bookings'
            );
          },
          1200
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถยืนยันการจองได้'
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-105 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-sm text-slate-400">
            กำลังเตรียมข้อมูลการจอง...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
   * LOAD ERROR
   * ===================================================== */

  if (
    error &&
    (!service ||
      !sitter)
  ) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/owner/search"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />

          กลับไปค้นหาผู้รับฝาก
        </Link>

        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
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
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      {/* BACK */}

      <Link
        href={`/owner/search/${sitter.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 transition hover:text-purple-900"
      >
        <ArrowLeft className="h-4 w-4" />

        กลับหน้าโปรไฟล์ Sitter
      </Link>

      {/* HEADER */}

      <section className="mt-5 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
          <CalendarDays className="h-4 w-4" />

          Booking
        </div>

        <h1 className="mt-3 text-2xl font-black text-purple-950 sm:text-3xl">
          จองบริการฝากสัตว์เลี้ยง
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          เลือกสัตว์และวันที่ฝาก
          จากนั้นตรวจสอบรายละเอียดก่อนส่งคำขอ
        </p>
      </section>

      {/* SUCCESS */}

      {success && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>
            <p className="text-sm font-bold text-emerald-800">
              ส่งคำขอจองเรียบร้อยแล้ว
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              กำลังพาไปหน้ารายการจอง...
            </p>
          </div>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* LEFT */}

        <div className="space-y-5">
          {/* SITTER */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
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

                <p className="mt-1 text-xs text-emerald-600">
                  พร้อมรับฝาก
                </p>
              </div>
            </div>
          </section>

          {/* SERVICE */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-purple-950">
              บริการที่เลือก
            </h2>

            <div className="mt-4 rounded-2xl bg-[#FAF8FE] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-black text-purple-950">
                    {
                      service.service_name
                    }
                  </h3>

                  <p className="mt-1 text-xs text-purple-600">
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
                    {
                      service.price_unit
                    }
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PET */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-purple-950">
              เลือกสัตว์เลี้ยง
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              แสดงเฉพาะสัตว์ที่ตรงกับประเภทบริการ
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
                  {getCategoryLabel(
                    service.category_id
                  )}{' '}
                  ก่อนทำการจอง
                </p>

                <Link
                  href="/owner/pets"
                  className="mt-4 inline-flex rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white"
                >
                  จัดการสัตว์เลี้ยง
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pets.map(
                  (pet) => {
                    const selected =
                      pet.id ===
                      selectedPetId;

                    return (
                      <button
                        key={
                          pet.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedPetId(
                            pet.id
                          )
                        }
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
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

                          <p className="mt-1 text-[10px] text-slate-400">
                            {pet.breed ||
                              getCategoryLabel(
                                pet.category_id
                              )}
                          </p>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* DATES */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
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
                  min={today}
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
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
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
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            {numberOfDays >
              0 && (
              <p className="mt-3 text-xs text-purple-600">
                ระยะเวลาฝากทั้งหมด{' '}
                <span className="font-black">
                  {
                    numberOfDays
                  }{' '}
                  วัน
                </span>
              </p>
            )}
          </section>

          {/* NOTE */}

          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-purple-950">
              หมายเหตุถึง Sitter
            </h2>

            <textarea
              rows={5}
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
              placeholder="ข้อมูลเพิ่มเติมที่ต้องการแจ้ง Sitter..."
              className="mt-4 w-full resize-none rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </section>
        </div>

        {/* SUMMARY */}

        <aside>
          <div className="sticky top-24 rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
            <h2 className="font-black text-purple-950">
              สรุปการจอง
            </h2>

            <div className="mt-5 space-y-4">
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
                label="ราคาต่อวัน"
                value={formatCurrency(
                  dailyRate
                )}
              />

              <SummaryRow
                label="จำนวนวัน"
                value={
                  numberOfDays >
                  0
                    ? `${numberOfDays} วัน`
                    : '-'
                }
              />

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
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
                success ||
                pets.length ===
                  0 ||
                !selectedPetId ||
                !startDate ||
                !endDate
              }
              onClick={() =>
                void handleSubmit()
              }
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  กำลังส่งคำขอ...
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4" />

                  ยืนยันการจอง
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
              หลังยืนยัน
              คำขอจะถูกส่งไปยัง Sitter
              และมีสถานะรอการตอบรับ
            </p>
          </div>
        </aside>
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