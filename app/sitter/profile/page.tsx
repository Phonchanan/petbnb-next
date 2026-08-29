/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  Bell,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  ImagePlus,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Settings,
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

  phone:
    | string
    | null;
}

interface PasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

const initialPasswordForm: PasswordFormState = {
  newPassword: '',
  confirmPassword: '',
};

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

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    phone,
    setPhone,
  ] =
    useState('');

  const [
    emailNotifications,
    setEmailNotifications,
  ] =
    useState(true);

  const [
    passwordForm,
    setPasswordForm,
  ] =
    useState<PasswordFormState>(
      initialPasswordForm
    );

  const [
    changingPassword,
    setChangingPassword,
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

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

  /* =======================================================
   * LOADING STATES
   * ===================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingNotification,
    setSavingNotification,
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

          setEmail(
            current.email || ''
          );

          const {
            data: {
              user: authUser,
            },
          } =
            await supabase.auth.getUser();

          setEmailNotifications(
            authUser?.user_metadata
              ?.email_notifications !== false
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
                last_name,
                phone
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

            setPhone(
              userProfile.phone ?? ''
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

  const saveProfile =
    useCallback(
      async () => {
        if (
          !profile ||
          !userId
        ) {
          return;
        }

        try {
          setError('');

          const now =
            new Date().toISOString();

          const {
            error:
              accountUpdateError,
          } =
            await supabase
              .from('profiles')
              .update({
                display_name:
                  displayName.trim() ||
                  'ผู้รับฝากสัตว์เลี้ยง',

                phone:
                  phone.trim() ||
                  null,

                updated_at:
                  now,
              })
              .eq(
                'id',
                userId
              );

          if (
            accountUpdateError
          ) {
            throw new Error(
              accountUpdateError.message
            );
          }

          const {
            error:
              sitterUpdateError,
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

                updated_at:
                  now,
              })
              .eq(
                'id',
                profile.id
              );

          if (
            sitterUpdateError
          ) {
            throw new Error(
              sitterUpdateError.message
            );
          }

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
        }
      },
      [
        profile,
        userId,
        displayName,
        phone,
        locationId,
        houseType,
        specialty,
      ]
    );

  const handleSaveOnEnter = (
    event:
      React.KeyboardEvent<
        HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
      >
  ) => {
    if (
      event.key !==
      'Enter'
    ) {
      return;
    }

    /*
     * textarea:
     * Enter = บันทึก
     * Shift + Enter = ขึ้นบรรทัดใหม่
     */
    if (
      event.currentTarget
        .tagName ===
        'TEXTAREA' &&
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    void saveProfile();
  };

  const handleEmailNotificationChange =
    async (
      nextValue: boolean
    ) => {
      if (
        savingNotification
      ) {
        return;
      }

      const previousValue =
        emailNotifications;

      setEmailNotifications(
        nextValue
      );

      try {
        setSavingNotification(true);
        setError('');

        const {
          error:
            notificationError,
        } =
          await supabase.auth.updateUser({
            data: {
              email_notifications:
                nextValue,
            },
          });

        if (
          notificationError
        ) {
          throw notificationError;
        }
      } catch (err) {
        console.error(
          'AUTO SAVE EMAIL NOTIFICATION ERROR:',
          err
        );

        setEmailNotifications(
          previousValue
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถอัปเดตการแจ้งเตือนได้'
        );
      } finally {
        setSavingNotification(false);
      }
    };

  /* =======================================================
   * CHANGE PASSWORD
   * เหมือนหน้า Owner
   * ===================================================== */

  const handleChangePassword =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const newPassword =
        passwordForm.newPassword.trim();

      const confirmPassword =
        passwordForm.confirmPassword.trim();

      if (
        newPassword.length <
        8
      ) {
        setError(
          'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'
        );
        setMessage('');
        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน'
        );
        setMessage('');
        return;
      }

      try {
        setChangingPassword(true);
        setError('');
        setMessage('');

        const {
          error:
            updateError,
        } =
          await supabase.auth.updateUser({
            password:
              newPassword,
          });

        if (
          updateError
        ) {
          throw updateError;
        }

        setPasswordForm(
          initialPasswordForm
        );

        setShowNewPassword(false);
        setShowConfirmPassword(false);

        setMessage(
          'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'CHANGE PASSWORD ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถเปลี่ยนรหัสผ่านได้'
        );
      } finally {
        setChangingPassword(false);
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
      {(message || error) && (
        <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:top-6">
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl shadow-slate-200/50 ${
              error
                ? 'border-rose-200'
                : 'border-emerald-200'
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                error
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {error ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-black ${
                  error
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }`}
              >
                {error
                  ? 'ไม่สามารถดำเนินการได้'
                  : 'สำเร็จ'}
              </p>

              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                {error || message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              aria-label="ปิดการแจ้งเตือน"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        {/* =================================================
         * HEADER
         * =============================================== */}

        <section className="relative overflow-hidden rounded-[28px] border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50/60 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-purple-100/70 blur-3xl" />
          <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <PawPrint className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-purple-600">
                Profile & Settings
              </p>

              <h1 className="mt-1 text-xl font-black text-purple-950 sm:text-2xl">
                โปรไฟล์และการตั้งค่า
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                จัดการข้อมูลผู้รับฝาก รูปสถานที่
                ข้อมูลบัญชี การแจ้งเตือน และความปลอดภัย
                ได้จากหน้าเดียว
              </p>
            </div>
          </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <div className="min-w-0 w-full lg:h-full">
        {/* =================================================
         * AVATAR
         * =============================================== */}

        <section className="flex flex-col rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6 lg:h-full">
          <SectionTitle
            icon={
              <UserRound className="h-5 w-5" />
            }
            title="โปรไฟล์ผู้รับฝาก"
          />

          <div className="mt-5 flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-center">
            {/* IMAGE */}

            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-purple-50 shadow-md ring-1 ring-purple-100">
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
                  className="object-contain p-1"
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
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        
          <div className="mt-5 grid gap-4 border-t border-purple-100 pt-5 sm:grid-cols-2">
            <Field>
              <Label>
                <UserRound className="h-4 w-4" />
                ชื่อที่แสดง
              </Label>

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value
                  )
                }
                className="input-style"
                placeholder="ชื่อที่ต้องการให้ Owner เห็น"
              />
            </Field>

            <Field>
              <Label>
                <Phone className="h-4 w-4" />
                เบอร์โทรศัพท์
              </Label>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                className="input-style"
                placeholder="เช่น 08x-xxx-xxxx"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field>
                <Label>
                  <Mail className="h-4 w-4" />
                  อีเมล
                </Label>

                <input
                  type="email"
                  value={email}
                  disabled
                  className="input-style cursor-not-allowed bg-slate-50 text-slate-400"
                />

                <p className="mt-1 text-[10px] text-slate-400">
                  อีเมลที่ใช้สำหรับเข้าสู่ระบบ
                </p>
              </Field>
            </div>
          </div>


          <div className="mt-6 border-t border-purple-100 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Home className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-black text-purple-950">
                  ข้อมูลการให้บริการ
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  พื้นที่รับฝาก ประเภทสถานที่ และข้อมูลแนะนำตัว
                </p>
              </div>
            </div>

<div className="grid content-start gap-4 sm:grid-cols-2">
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

            {/* SPECIALTY */}

            <div className="sm:col-span-2">
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
                  onKeyDown={
                    handleSaveOnEnter
                  }
                  placeholder="เช่น มีประสบการณ์เลี้ยงแมวหลายปี มีพื้นที่แยกสำหรับสัตว์..."
                  className="input-style resize-none"
                />
              </Field>
            </div>
          </div>
          </div>
</section>
          </div>

          <div className="min-w-0 w-full space-y-5 lg:grid lg:h-full lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-5 lg:space-y-0">
        {/* =================================================
         * PLACE IMAGES
         * =============================================== */}

        <section className="flex flex-col rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
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

          <p className="mt-2 text-xs leading-5 text-slate-500">
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 px-4 py-4 text-xs font-bold text-purple-600 transition hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50"
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

          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            เลือกหลายรูปพร้อมกันได้ •
            สูงสุด 5 รูป •
            ไม่เกิน 5 MB ต่อรูป
          </p>

          {/* GALLERY */}

          {placeImages.length >
          0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {placeImages.map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={
                      image.id
                    }
                    className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-[#FAF8FE] shadow-sm"
                  >
                    <div className="relative aspect-square max-h-28">
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
                        className="object-contain p-1"
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
            <div className="mt-4 flex min-h-[120px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
              <Upload className="h-7 w-7 text-slate-300" />

              <p className="mt-2 text-xs text-slate-400">
                ยังไม่มีรูปสถานที่
              </p>
            </div>
          )}
        </section>

        {/* =================================================
         * ACCOUNT SETTINGS
         * =============================================== */}

        <section className="flex min-h-0 w-full flex-col rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6 lg:h-full">
          <SectionTitle
            icon={
              <Settings className="h-5 w-5" />
            }
            title="การตั้งค่าบัญชี"
          />

          <div className="mt-5 flex flex-col gap-5">
            {/* NOTIFICATION */}
            <div className="flex min-h-[104px] items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-[#FCFAFF] p-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Bell className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black text-purple-950">
                    การแจ้งเตือนผ่านอีเมล
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    รับข้อมูลคำขอจองและการเปลี่ยนแปลงสำคัญของบัญชี
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={emailNotifications}
                disabled={
                  savingNotification
                }
                onClick={() =>
                  void handleEmailNotificationChange(
                    !emailNotifications
                  )
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  emailNotifications
                    ? 'bg-purple-600'
                    : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    emailNotifications
                      ? 'left-6'
                      : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col rounded-2xl border border-purple-100 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                  <KeyRound className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-black text-purple-950">
                    เปลี่ยนรหัสผ่าน
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร
                  </p>
                </div>
              </div>

              <form
                onSubmit={
                  handleChangePassword
                }
                className="mt-4 space-y-4"
              >
                <PasswordField
                  label="รหัสผ่านใหม่"
                  value={
                    passwordForm.newPassword
                  }
                  showPassword={
                    showNewPassword
                  }
                  onToggleShow={() =>
                    setShowNewPassword(
                      (current) =>
                        !current
                    )
                  }
                  onChange={(
                    value
                  ) =>
                    setPasswordForm(
                      (
                        current
                      ) => ({
                        ...current,
                        newPassword:
                          value,
                      })
                    )
                  }
                  placeholder="กรอกรหัสผ่านใหม่"
                />

                <PasswordField
                  label="ยืนยันรหัสผ่านใหม่"
                  value={
                    passwordForm.confirmPassword
                  }
                  showPassword={
                    showConfirmPassword
                  }
                  onToggleShow={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                  onChange={(
                    value
                  ) =>
                    setPasswordForm(
                      (
                        current
                      ) => ({
                        ...current,
                        confirmPassword:
                          value,
                      })
                    )
                  }
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                />

                <div className="flex justify-end border-t border-purple-100 pt-4">
                  <button
                    type="submit"
                    disabled={
                      changingPassword
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        กำลังเปลี่ยนรหัสผ่าน...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        เปลี่ยนรหัสผ่าน
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
          </div>
        </div>
      </div>

      {/* =================================================
       * GLOBAL INPUT STYLE
       * =============================================== */}

      <style jsx global>{`
        .input-style {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(252 250 255);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
          transition: 0.2s ease;
        }

        .input-style:focus {
          border-color: rgb(192 132 252);
          background: white;
          box-shadow: 0 0 0 4px rgb(243 232 255);
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

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-purple-950">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            showPassword
              ? 'text'
              : 'password'
          }
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          autoComplete="new-password"
          className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        />

        <button
          type="button"
          onClick={
            onToggleShow
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600"
          aria-label={
            showPassword
              ? 'ซ่อนรหัสผ่าน'
              : 'แสดงรหัสผ่าน'
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
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