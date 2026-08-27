/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Home,
  ImagePlus,
  Loader2,
  MapPin,
  PawPrint,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth';

import {
  MAX_SITTER_PLACE_IMAGES,
  SitterPlaceImage,
  SitterPlaceImageService,
} from '@/lib/supabase/sitterPlaceImageService';

/* =========================================================
 * DISTRICTS
 * ======================================================= */

const SURAT_DISTRICTS = [
  'อำเภอเมืองสุราษฎร์ธานี',
  'อำเภอกาญจนดิษฐ์',
  'อำเภอดอนสัก',
  'อำเภอเกาะสมุย',
  'อำเภอเกาะพะงัน',
  'อำเภอไชยา',
  'อำเภอท่าชนะ',
  'อำเภอคีรีรัฐนิคม',
  'อำเภอบ้านตาขุน',
  'อำเภอพนม',
  'อำเภอท่าฉาง',
  'อำเภอบ้านนาสาร',
  'อำเภอบ้านนาเดิม',
  'อำเภอเคียนซา',
  'อำเภอเวียงสระ',
  'อำเภอพระแสง',
  'อำเภอพุนพิน',
  'อำเภอชัยบุรี',
  'อำเภอวิภาวดี',
];

/* =========================================================
 * TYPES
 * ======================================================= */

interface SitterProfileRow {
  id: string;
  user_id: string;

  location_id: string | null;

  house_type: string | null;
  specialty: string | null;

  experience_years: number;

  starting_price:
    | number
    | string;

  is_verified: boolean;
  is_available: boolean;

  verification_status:
    string;

  created_at: string;
  updated_at: string;
}

interface LocationRow {
  id: string;
  province: string;
  district: string;
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function SitterProfilePage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [profile, setProfile] =
    useState<SitterProfileRow | null>(
      null
    );

  const [userId, setUserId] =
    useState('');

  const [locations, setLocations] =
    useState<LocationRow[]>([]);

  const [placeImages, setPlaceImages] =
    useState<SitterPlaceImage[]>([]);

  const [locationId, setLocationId] =
    useState('');

  const [houseType, setHouseType] =
    useState('');

  const [specialty, setSpecialty] =
    useState('');

  const [
    experienceYears,
    setExperienceYears,
  ] = useState('0');

  const [
    startingPrice,
    setStartingPrice,
  ] = useState('0');

  const [
    isAvailable,
    setIsAvailable,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingImages,
    setUploadingImages,
  ] = useState(false);

  const [
    deletingImageId,
    setDeletingImageId,
  ] = useState<string | null>(
    null
  );

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  /* =======================================================
   * LOAD
   * ===================================================== */

  const loadPage =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');

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
              .toUpperCase() !==
            'SITTER'
          ) {
            router.replace('/');
            return;
          }

          setUserId(
            current.id
          );

          /* SITTER PROFILE */

          const {
            data:
              sitterData,
            error:
              sitterError,
          } = await supabase
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
              verification_status,
              created_at,
              updated_at
            `)
            .eq(
              'user_id',
              current.id
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
            router.replace(
              '/sitter/onboarding/consent'
            );
            return;
          }

          const sitter =
            sitterData as unknown as SitterProfileRow;

          setProfile(
            sitter
          );

          setLocationId(
            sitter.location_id ??
              ''
          );

          setHouseType(
            sitter.house_type ??
              ''
          );

          setSpecialty(
            sitter.specialty ??
              ''
          );

          setExperienceYears(
            String(
              sitter.experience_years ??
                0
            )
          );

          setStartingPrice(
            String(
              sitter.starting_price ??
                0
            )
          );

          setIsAvailable(
            sitter.is_available
          );

          /* LOCATIONS */

          const {
            data:
              locationData,
            error:
              locationError,
          } = await supabase
            .from(
              'locations'
            )
            .select(`
              id,
              province,
              district
            `)
            .eq(
              'province',
              'สุราษฎร์ธานี'
            )
            .order(
              'district',
              {
                ascending:
                  true,
              }
            );

          if (
            locationError
          ) {
            console.error(
              locationError
            );
          } else {
            const rows =
              (locationData ??
                []) as unknown as LocationRow[];

            setLocations(
              rows.filter(
                (location) =>
                  SURAT_DISTRICTS.includes(
                    location.district
                  )
              )
            );
          }

          /* PLACE IMAGES */

          const images =
            await SitterPlaceImageService.getImages(
              sitter.id
            );

          setPlaceImages(
            images
          );
        } catch (err) {
          console.error(
            'LOAD SITTER PROFILE ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้'
          );
        } finally {
          setLoading(false);
        }
      },
      [router]
    );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  /* =======================================================
   * SAVE PROFILE
   * ===================================================== */

  const handleSave =
    async () => {
      if (!profile) {
        return;
      }

      const experience =
        Number(
          experienceYears
        );

      const price =
        Number(
          startingPrice
        );

      if (
        Number.isNaN(
          experience
        ) ||
        experience < 0
      ) {
        setError(
          'จำนวนปีประสบการณ์ไม่ถูกต้อง'
        );
        return;
      }

      if (
        Number.isNaN(
          price
        ) ||
        price < 0
      ) {
        setError(
          'ราคาเริ่มต้นไม่ถูกต้อง'
        );
        return;
      }

      if (
        isAvailable &&
        !profile.is_verified
      ) {
        setError(
          'บัญชียังไม่ได้รับการอนุมัติจาก Admin จึงไม่สามารถเปิดรับงานได้'
        );

        setIsAvailable(
          false
        );

        return;
      }

      try {
        setSaving(true);
        setError('');
        setMessage('');

        const {
          error:
            updateError,
        } = await supabase
          .from(
            'sitter_profiles'
          )
          .update({
            location_id:
              locationId ||
              null,

            house_type:
              houseType.trim() ||
              null,

            specialty:
              specialty.trim() ||
              null,

            experience_years:
              experience,

            starting_price:
              price,

            is_available:
              profile.is_verified
                ? isAvailable
                : false,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            profile.id
          );

        if (
          updateError
        ) {
          throw new Error(
            updateError.message
          );
        }

        setMessage(
          'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว'
        );

        setProfile(
          (current) =>
            current
              ? {
                  ...current,

                  location_id:
                    locationId ||
                    null,

                  house_type:
                    houseType,

                  specialty,

                  experience_years:
                    experience,

                  starting_price:
                    price,

                  is_available:
                    current.is_verified
                      ? isAvailable
                      : false,
                }
              : current
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถบันทึกข้อมูลได้'
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
   * UPLOAD IMAGES
   * ===================================================== */

  const handleFileChange =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      if (
        !profile ||
        !userId
      ) {
        return;
      }

      const files =
        Array.from(
          event.target.files ??
            []
        );

      /*
       * reset input
       */
      event.target.value =
        '';

      if (
        files.length === 0
      ) {
        return;
      }

      const remaining =
        MAX_SITTER_PLACE_IMAGES -
        placeImages.length;

      if (
        remaining <= 0
      ) {
        setError(
          `อัปโหลดได้สูงสุด ${MAX_SITTER_PLACE_IMAGES} รูป`
        );
        return;
      }

      if (
        files.length >
        remaining
      ) {
        setError(
          `สามารถเพิ่มได้อีก ${remaining} รูป`
        );
        return;
      }

      try {
        setUploadingImages(
          true
        );

        setError('');
        setMessage('');

        await SitterPlaceImageService.uploadImages(
          profile.id,
          userId,
          files
        );

        const images =
          await SitterPlaceImageService.getImages(
            profile.id
          );

        setPlaceImages(
          images
        );

        setMessage(
          `อัปโหลดรูปสถานที่เรียบร้อยแล้ว`
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถอัปโหลดรูปได้'
        );
      } finally {
        setUploadingImages(
          false
        );
      }
    };

  /* =======================================================
   * DELETE IMAGE
   * ===================================================== */

  const handleDeleteImage =
    async (
      image: SitterPlaceImage
    ) => {
      const confirmed =
        window.confirm(
          'ต้องการลบรูปนี้หรือไม่?'
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingImageId(
          image.id
        );

        setError('');
        setMessage('');

        await SitterPlaceImageService.deleteImage(
          image
        );

        setPlaceImages(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                image.id
            )
        );

        setMessage(
          'ลบรูปเรียบร้อยแล้ว'
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถลบรูปได้'
        );
      } finally {
        setDeletingImageId(
          null
        );
      }
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-600" />

            <p className="mt-3 text-sm text-slate-400">
              กำลังโหลดโปรไฟล์...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* HEADER */}

        <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <PawPrint className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-purple-600">
                Sitter Profile
              </p>

              <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                โปรไฟล์ผู้รับฝาก
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                เพิ่มข้อมูลและรูปสถานที่
                เพื่อช่วยให้ Owner
                ตัดสินใจเลือกบริการได้ง่ายขึ้น
              </p>
            </div>
          </div>
        </section>

        {/* STATUS */}

        <section className="mt-5">
          {profile.is_verified ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  บัญชีได้รับการอนุมัติแล้ว
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  สามารถเปิดสถานะพร้อมรับงานได้
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />

              <div>
                <p className="text-sm font-bold text-amber-800">
                  สถานะ:{' '}
                  {
                    profile.verification_status
                  }
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  ต้องได้รับการอนุมัติจาก Admin
                  ก่อนเปิดรับงาน
                </p>
              </div>
            </div>
          )}
        </section>

        {/* MESSAGE */}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />

            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            {error}
          </div>
        )}

        {/* PROFILE FORM */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <Home className="h-5 w-5" />
            }
            title="ข้อมูลการให้บริการ"
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* LOCATION */}

            <Field>
              <Label>
                <MapPin className="h-4 w-4" />
                พื้นที่ให้บริการ
              </Label>

              <select
                value={
                  locationId
                }
                onChange={(
                  event
                ) =>
                  setLocationId(
                    event.target
                      .value
                  )
                }
                className="input-style"
              >
                <option value="">
                  เลือกอำเภอ
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={
                        location.id
                      }
                      value={
                        location.id
                      }
                    >
                      {
                        location.district
                      }
                    </option>
                  )
                )}
              </select>

              <p className="mt-1 text-[10px] text-slate-400">
                จังหวัดสุราษฎร์ธานี
              </p>
            </Field>

            {/* HOUSE */}

            <Field>
              <Label>
                ประเภทสถานที่
              </Label>

              <select
                value={
                  houseType
                }
                onChange={(
                  event
                ) =>
                  setHouseType(
                    event.target
                      .value
                  )
                }
                className="input-style"
              >
                <option value="">
                  เลือกประเภท
                </option>

                <option value="HOUSE">
                  บ้าน
                </option>

                <option value="TOWNHOUSE">
                  ทาวน์เฮาส์
                </option>

                <option value="CONDO">
                  คอนโด
                </option>

                <option value="APARTMENT">
                  อพาร์ตเมนต์
                </option>

                <option value="OTHER">
                  อื่น ๆ
                </option>
              </select>
            </Field>

            {/* EXPERIENCE */}

            <Field>
              <Label>
                ประสบการณ์ดูแลสัตว์
              </Label>

              <input
                type="number"
                min="0"
                value={
                  experienceYears
                }
                onChange={(
                  event
                ) =>
                  setExperienceYears(
                    event.target
                      .value
                  )
                }
                className="input-style"
              />

              <p className="mt-1 text-[10px] text-slate-400">
                หน่วย: ปี
              </p>
            </Field>

            {/* PRICE */}

            <Field>
              <Label>
                ราคาเริ่มต้น
              </Label>

              <input
                type="number"
                min="0"
                value={
                  startingPrice
                }
                onChange={(
                  event
                ) =>
                  setStartingPrice(
                    event.target
                      .value
                  )
                }
                className="input-style"
              />

              <p className="mt-1 text-[10px] text-slate-400">
                บาท
              </p>
            </Field>

            {/* SPECIALTY */}

            <div className="md:col-span-2">
              <Field>
                <Label>
                  ความถนัด /
                  ข้อมูลแนะนำตัว
                </Label>

                <textarea
                  rows={5}
                  value={
                    specialty
                  }
                  onChange={(
                    event
                  ) =>
                    setSpecialty(
                      event.target
                        .value
                    )
                  }
                  placeholder="เช่น มีประสบการณ์เลี้ยงแมวหลายปี มีพื้นที่แยกสำหรับสัตว์..."
                  className="input-style resize-none"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* PLACE IMAGES */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <SectionTitle
              icon={
                <Camera className="h-5 w-5" />
              }
              title="รูปสถานที่รับฝาก"
            />

            <div className="text-xs text-slate-400">
              {
                placeImages.length
              }
              /
              {
                MAX_SITTER_PLACE_IMAGES
              }{' '}
              รูป
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            แนะนำให้อัปโหลดภาพพื้นที่จริง
            เช่น ห้องที่สัตว์พัก
            พื้นที่เล่น หรือบริเวณภายในบ้าน
            เพื่อช่วยให้ Owner ตัดสินใจ
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={
              handleFileChange
            }
          />

          {/* UPLOAD */}

          {placeImages.length <
            MAX_SITTER_PLACE_IMAGES && (
            <button
              type="button"
              disabled={
                uploadingImages
              }
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 px-4 py-6 text-sm font-bold text-purple-600 transition hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50"
            >
              {uploadingImages ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" />
                  เพิ่มรูปสถานที่
                </>
              )}
            </button>
          )}

          <p className="mt-2 text-center text-[10px] text-slate-400">
            เลือกหลายรูปพร้อมกันได้ •
            สูงสุด 5 รูป •
            ไม่เกิน 5 MB ต่อรูป
          </p>

          {/* GALLERY */}

          {placeImages.length >
          0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {placeImages.map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={
                      image.id
                    }
                    className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={
                          image.imageUrl
                        }
                        alt={`สถานที่รับฝาก ${
                          index + 1
                        }`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    {index ===
                      0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-purple-600 px-2 py-1 text-[9px] font-bold text-white">
                        รูปหลัก
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={
                        deletingImageId ===
                        image.id
                      }
                      onClick={() =>
                        void handleDeleteImage(
                          image
                        )
                      }
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow transition hover:bg-red-50 disabled:opacity-50"
                      title="ลบรูป"
                    >
                      {deletingImageId ===
                      image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5 flex min-h-37.5 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
              <Upload className="h-7 w-7 text-slate-300" />

              <p className="mt-2 text-xs text-slate-400">
                ยังไม่มีรูปสถานที่
              </p>
            </div>
          )}
        </section>

        {/* AVAILABILITY */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-purple-950">
                พร้อมรับงาน
              </p>

              <p className="mt-1 text-xs text-slate-500">
                เมื่อเปิดใช้งาน
                Owner จะสามารถค้นหาโปรไฟล์ของคุณได้
              </p>
            </div>

            <button
              type="button"
              disabled={
                !profile.is_verified
              }
              onClick={() =>
                setIsAvailable(
                  (current) =>
                    !current
                )
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                isAvailable
                  ? 'bg-emerald-500'
                  : 'bg-slate-300'
              } ${
                !profile.is_verified
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                  isAvailable
                    ? 'left-6'
                    : 'left-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* SAVE */}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void handleSave()
            }
            className="inline-flex min-w-45 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            บันทึกข้อมูล
          </button>
        </div>
      </div>

      {/* Tailwind utility for form fields */}
      <style jsx global>{`
        .input-style {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
          transition: 0.2s;
        }

        .input-style:focus {
          border-color: rgb(192 132 252);
          box-shadow: 0 0 0 3px
            rgb(243 232 255);
        }
      `}</style>
    </main>
  );
}

/* =========================================================
 * COMPONENTS
 * ======================================================= */

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        {icon}
      </div>

      <h2 className="text-sm font-black text-purple-950 sm:text-base">
        {title}
      </h2>
    </div>
  );
}

function Field({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}

function Label({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-600">
      {children}
    </label>
  );
}