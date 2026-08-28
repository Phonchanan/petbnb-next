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
  UserRound,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth';

import {
  MAX_SITTER_PLACE_IMAGES,
  SitterPlaceImage,
  SitterPlaceImageService,
} from '@/lib/supabase/sitterPlaceImageService';

/* =========================================================
 * CONFIG
 * ======================================================= */

const PROFILE_IMAGE_BUCKET =
  'profile-images';

const MAX_AVATAR_SIZE =
  5 * 1024 * 1024;

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

  location_id:
    | string
    | null;

  house_type:
    | string
    | null;

  specialty:
    | string
    | null;

  experience_years:
    number;

  starting_price:
    | number
    | string;

  is_verified:
    boolean;

  is_available:
    boolean;

  verification_status:
    string;

  created_at:
    string;

  updated_at:
    string;
}

interface LocationRow {
  id: string;

  province:
    string;

  district:
    string;
}

interface UserProfileRow {
  id: string;

  avatar_url:
    | string
    | null;

  display_name:
    | string
    | null;

  first_name:
    | string
    | null;

  last_name:
    | string
    | null;
}

/* =========================================================
 * PAGE
 * ======================================================= */

export default function SitterProfilePage() {
  const router =
    useRouter();

  /* =======================================================
   * FILE INPUT REFS
   * ===================================================== */

  const avatarInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  /* =======================================================
   * PROFILE STATE
   * ===================================================== */

  const [
    profile,
    setProfile,
  ] =
    useState<SitterProfileRow | null>(
      null
    );

  const [
    userId,
    setUserId,
  ] =
    useState('');

  const [
    displayName,
    setDisplayName,
  ] =
    useState('');

  /* =======================================================
   * AVATAR
   * ===================================================== */

  const [
    avatarUrl,
    setAvatarUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] =
    useState(false);

  /* =======================================================
   * LOCATIONS
   * ===================================================== */

  const [
    locations,
    setLocations,
  ] =
    useState<LocationRow[]>(
      []
    );

  /* =======================================================
   * PLACE IMAGES
   * ===================================================== */

  const [
    placeImages,
    setPlaceImages,
  ] =
    useState<SitterPlaceImage[]>(
      []
    );

  /* =======================================================
   * FORM
   * ===================================================== */

  const [
    locationId,
    setLocationId,
  ] =
    useState('');

  const [
    houseType,
    setHouseType,
  ] =
    useState('');

  const [
    specialty,
    setSpecialty,
  ] =
    useState('');

  const [
    experienceYears,
    setExperienceYears,
  ] =
    useState('0');

  const [
    startingPrice,
    setStartingPrice,
  ] =
    useState('0');

  const [
    isAvailable,
    setIsAvailable,
  ] =
    useState(false);

  /* =======================================================
   * LOADING STATES
   * ===================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    uploadingImages,
    setUploadingImages,
  ] =
    useState(false);

  const [
    deletingImageId,
    setDeletingImageId,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
   * MESSAGE
   * ===================================================== */

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    message,
    setMessage,
  ] =
    useState('');

  /* =======================================================
   * LOAD PAGE
   * ===================================================== */

  const loadPage =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError('');

          setMessage('');

          /* ===============================================
           * CURRENT USER
           * ============================================= */

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
            router.replace(
              '/'
            );

            return;
          }

          setUserId(
            current.id
          );

          /* ===============================================
           * USER PROFILE
           *
           * อ่าน avatar_url จาก profiles
           * ============================================= */

          const {
            data:
              userProfileData,

            error:
              userProfileError,
          } =
            await supabase
              .from(
                'profiles'
              )
              .select(`
                id,
                avatar_url,
                display_name,
                first_name,
                last_name
              `)
              .eq(
                'id',
                current.id
              )
              .maybeSingle();

          if (
            userProfileError
          ) {
            console.error(
              'LOAD USER PROFILE ERROR:',
              userProfileError
            );
          } else if (
            userProfileData
          ) {
            const userProfile =
              userProfileData as UserProfileRow;

            setAvatarUrl(
              userProfile.avatar_url ??
                null
            );

            const name =
              userProfile.display_name
                ?.trim() ||
              [
                userProfile.first_name,
                userProfile.last_name,
              ]
                .filter(Boolean)
                .join(' ')
                .trim() ||
              'ผู้รับฝากสัตว์เลี้ยง';

            setDisplayName(
              name
            );
          }

          /* ===============================================
           * SITTER PROFILE
           * ============================================= */

          const {
            data:
              sitterData,

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

          /* ===============================================
           * LOCATIONS
           * ============================================= */

          const {
            data:
              locationData,

            error:
              locationError,
          } =
            await supabase
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
              'LOAD LOCATIONS ERROR:',
              locationError
            );
          } else {
            const rows =
              (
                locationData ??
                []
              ) as unknown as LocationRow[];

            setLocations(
              rows.filter(
                (
                  location
                ) =>
                  SURAT_DISTRICTS.includes(
                    location.district
                  )
              )
            );
          }

          /* ===============================================
           * PLACE IMAGES
           * ============================================= */

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
      [
        router,
      ]
    );

  useEffect(() => {
    void loadPage();
  }, [
    loadPage,
  ]);

  /* =======================================================
   * UPLOAD AVATAR
   * ===================================================== */

  const handleAvatarChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      /*
       * reset input
       * ทำให้เลือกไฟล์เดิมซ้ำได้
       */
      event.target.value =
        '';

      if (
        !file ||
        !userId
      ) {
        return;
      }

      /* ===============================================
       * VALIDATE TYPE
       * ============================================= */

      if (
        !file.type.startsWith(
          'image/'
        )
      ) {
        setError(
          'กรุณาเลือกไฟล์รูปภาพ'
        );

        return;
      }

      /* ===============================================
       * VALIDATE SIZE
       * ============================================= */

      if (
        file.size >
        MAX_AVATAR_SIZE
      ) {
        setError(
          'รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB'
        );

        return;
      }

      try {
        setUploadingAvatar(
          true
        );

        setError('');

        setMessage('');

        /* =============================================
         * FILE EXTENSION
         * =========================================== */

        const extension =
          file.name
            .split('.')
            .pop()
            ?.toLowerCase() ||
          'jpg';

        /* =============================================
         * FILE PATH
         *
         * profile-images/
         * └── USER_ID/
         *     └── avatar.jpg
         * =========================================== */

        const filePath =
          `${userId}/avatar.${extension}`;

        console.log(
          'UPLOAD AVATAR:',
          {
            bucket:
              PROFILE_IMAGE_BUCKET,

            filePath,

            userId,
          }
        );

        /* =============================================
         * UPLOAD TO STORAGE
         * =========================================== */

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              PROFILE_IMAGE_BUCKET
            )
            .upload(
              filePath,
              file,
              {
                upsert:
                  true,

                cacheControl:
                  '3600',

                contentType:
                  file.type,
              }
            );

        if (
          uploadError
        ) {
          console.error(
            'UPLOAD AVATAR STORAGE ERROR:',
            uploadError
          );

          throw new Error(
            uploadError.message
          );
        }

        /* =============================================
         * GET PUBLIC URL
         * =========================================== */

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from(
              PROFILE_IMAGE_BUCKET
            )
            .getPublicUrl(
              filePath
            );

        const publicUrl =
          publicUrlData.publicUrl
            ?.trim();

        if (
          !publicUrl
        ) {
          throw new Error(
            'ไม่สามารถสร้าง URL รูปโปรไฟล์ได้'
          );
        }

        console.log(
          'AVATAR PUBLIC URL:',
          publicUrl
        );

        /* =============================================
         * UPDATE profiles.avatar_url
         *
         * จุดสำคัญที่สุด
         * =========================================== */

        const {
          error:
            profileUpdateError,
        } =
          await supabase
            .from(
              'profiles'
            )
            .update({
              avatar_url:
                publicUrl,
            })
            .eq(
              'id',
              userId
            );

        if (
          profileUpdateError
        ) {
          console.error(
            'UPDATE PROFILE AVATAR ERROR:',
            profileUpdateError
          );

          throw new Error(
            profileUpdateError.message
          );
        }

        /*
         * เพิ่ม query timestamp
         * เฉพาะ state เพื่อกัน browser cache
         *
         * ใน database เก็บ URL ปกติ
         */
        setAvatarUrl(
          `${publicUrl}?v=${Date.now()}`
        );

        setMessage(
          'อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'UPLOAD PROFILE AVATAR ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้'
        );
      } finally {
        setUploadingAvatar(
          false
        );
      }
    };

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

      /* ===============================================
       * EXPERIENCE VALIDATION
       * ============================================= */

      if (
        Number.isNaN(
          experience
        ) ||
        experience <
          0
      ) {
        setError(
          'จำนวนปีประสบการณ์ไม่ถูกต้อง'
        );

        return;
      }

      /* ===============================================
       * PRICE VALIDATION
       * ============================================= */

      if (
        Number.isNaN(
          price
        ) ||
        price <
          0
      ) {
        setError(
          'ราคาเริ่มต้นไม่ถูกต้อง'
        );

        return;
      }

      /* ===============================================
       * AVAILABILITY VALIDATION
       * ============================================= */

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
        setSaving(
          true
        );

        setError('');

        setMessage('');

        /* =============================================
         * UPDATE SITTER PROFILE
         * =========================================== */

        const {
          error:
            updateError,
        } =
          await supabase
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
                new Date()
                  .toISOString(),
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
          (
            current
          ) =>
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
        console.error(
          'SAVE SITTER PROFILE ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถบันทึกข้อมูลได้'
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
   * UPLOAD PLACE IMAGES
   *
   * ส่วนเดิมของรูปสถานที่
   * ===================================================== */

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
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
        files.length ===
        0
      ) {
        return;
      }

      const remaining =
        MAX_SITTER_PLACE_IMAGES -
        placeImages.length;

      if (
        remaining <=
        0
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
          'อัปโหลดรูปสถานที่เรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'UPLOAD PLACE IMAGE ERROR:',
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
   * DELETE PLACE IMAGE
   * ===================================================== */

  const handleDeleteImage =
    async (
      image:
        SitterPlaceImage
    ) => {
      const confirmed =
        window.confirm(
          'ต้องการลบรูปนี้หรือไม่?'
        );

      if (
        !confirmed
      ) {
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
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                image.id
            )
        );

        setMessage(
          'ลบรูปเรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'DELETE PLACE IMAGE ERROR:',
          err
        );

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

  if (
    loading
  ) {
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

  if (
    !profile
  ) {
    return null;
  }

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* =================================================
         * HEADER
         * =============================================== */}

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
                เพิ่มข้อมูล รูปโปรไฟล์
                และรูปสถานที่
                เพื่อช่วยให้ Owner
                ตัดสินใจเลือกบริการได้ง่ายขึ้น
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
         * AVATAR
         * =============================================== */}

        <section className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={
              <UserRound className="h-5 w-5" />
            }
            title="รูปโปรไฟล์ผู้รับฝาก"
          />

          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            {/* IMAGE */}

            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[28px] border border-purple-100 bg-purple-50">
              {avatarUrl ? (
                <Image
                  src={
                    avatarUrl
                  }
                  alt={
                    displayName ||
                    'รูปโปรไฟล์ผู้รับฝาก'
                  }
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserRound className="h-10 w-10 text-purple-300" />
                </div>
              )}
            </div>

            {/* INFO */}

            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-black text-purple-950">
                {displayName ||
                  'รูปโปรไฟล์'}
              </p>

              <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                รูปนี้จะแสดงให้ Owner
                เห็นในหน้าค้นหาผู้รับฝาก
                และหน้ารายละเอียดผู้รับฝาก
              </p>

              {/* HIDDEN INPUT */}

              <input
                ref={
                  avatarInputRef
                }
                type="file"
                accept="image/*"
                className="hidden"
                onChange={
                  handleAvatarChange
                }
              />

              {/* BUTTON */}

              <button
                type="button"
                disabled={
                  uploadingAvatar
                }
                onClick={() =>
                  avatarInputRef.current?.click()
                }
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />

                    {avatarUrl
                      ? 'เปลี่ยนรูปโปรไฟล์'
                      : 'เพิ่มรูปโปรไฟล์'}
                  </>
                )}
              </button>

              <p className="mt-2 text-[10px] text-slate-400">
                รองรับไฟล์รูปภาพ •
                ขนาดไม่เกิน 5 MB
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
         * STATUS
         * =============================================== */}

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

        {/* =================================================
         * MESSAGE
         * =============================================== */}

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

        {/* =================================================
         * PROFILE FORM
         * =============================================== */}

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
                    event.target.value
                  )
                }
                className="input-style"
              >
                <option value="">
                  เลือกอำเภอ
                </option>

                {locations.map(
                  (
                    location
                  ) => (
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
                    event.target.value
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
                    event.target.value
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
                    event.target.value
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
                  rows={
                    5
                  }
                  value={
                    specialty
                  }
                  onChange={(
                    event
                  ) =>
                    setSpecialty(
                      event.target.value
                    )
                  }
                  placeholder="เช่น มีประสบการณ์เลี้ยงแมวหลายปี มีพื้นที่แยกสำหรับสัตว์..."
                  className="input-style resize-none"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* =================================================
         * PLACE IMAGES
         * =============================================== */}

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
            ref={
              fileInputRef
            }
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
                          index +
                          1
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

        {/* =================================================
         * AVAILABILITY
         * =============================================== */}

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
                  (
                    current
                  ) =>
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

        {/* =================================================
         * SAVE
         * =============================================== */}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={
              saving
            }
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

      {/* =================================================
       * GLOBAL INPUT STYLE
       * =============================================== */}

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
  icon:
    React.ReactNode;

  title:
    string;
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
  children:
    React.ReactNode;
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
  children:
    React.ReactNode;
}) {
  return (
    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-600">
      {children}
    </label>
  );
}