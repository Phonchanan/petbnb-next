/* eslint-disable @next/next/no-location-assign-relative-destination */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Bell,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  UserRound,
  XCircle,
} from 'lucide-react';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

import { supabase } from '@/lib/supabase/client';
import { ProfileService } from '@/lib/supabase/profileService';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  bio: string;
}


interface NotificationPreferences {
  bookingUpdates: boolean;
  careUpdates: boolean;
  reviewUpdates: boolean;
}

interface PasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

const initialForm: ProfileFormState = {
  firstName: '',
  lastName: '',
  displayName: '',
  phone: '',
  bio: '',
};

const initialNotificationPreferences: NotificationPreferences = {
  bookingUpdates: true,
  careUpdates: true,
  reviewUpdates: true,
};

const initialPasswordForm: PasswordFormState = {
  newPassword: '',
  confirmPassword: '',
};

export default function OwnerProfilePage() {
  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [form, setForm] =
    useState<ProfileFormState>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const lastSavedFormRef =
    useRef<ProfileFormState>(initialForm);

  const autoSaveTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSavingRef =
    useRef(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [toastType, setToastType] =
    useState<'success' | 'error'>('success');

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(
      initialNotificationPreferences
    );

  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(initialPasswordForm);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [selectedAvatar, setSelectedAvatar] =
    useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const current =
        await AuthService.getCurrentProfile();

      if (!current) {
        window.location.href = '/login';
        return;
      }

      if (!current.is_active) {
        await AuthService.signOut();
        window.location.href = '/login';
        return;
      }

      if (
        current.role.toUpperCase() !== 'OWNER'
      ) {
        if (
          current.role.toUpperCase() ===
          'SITTER'
        ) {
          window.location.href = '/sitter';
        } else {
          window.location.href = '/admin';
        }

        return;
      }

      setProfile(current);

      const loadedForm: ProfileFormState = {
        firstName:
          current.first_name || '',

        lastName:
          current.last_name || '',

        displayName:
          current.display_name || '',

        phone:
          current.phone || '',

        bio:
          current.bio || '',
      };

      lastSavedFormRef.current =
        loadedForm;

      setForm(loadedForm);

      setAvatarPreview(
        current.avatar_url || null
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const storedPreferences =
        user?.user_metadata?.notification_preferences;

      if (
        storedPreferences &&
        typeof storedPreferences === 'object'
      ) {
        setNotificationPreferences({
          bookingUpdates:
            storedPreferences.bookingUpdates ?? true,
          careUpdates:
            storedPreferences.careUpdates ?? true,
          reviewUpdates:
            storedPreferences.reviewUpdates ?? true,
        });
      }
    } catch (err) {
      console.error(
        'LOAD PROFILE ERROR:',
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
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (
        avatarPreview?.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }
    };
  }, [avatarPreview]);


  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setMessage('');
    }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [message]);

  const handleAvatarChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      setError(
        'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP'
      );

      event.target.value = '';
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        'รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB'
      );

      event.target.value = '';
      return;
    }

    if (
      avatarPreview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedAvatar(file);
    setAvatarPreview(previewUrl);
    setError('');
  };

  const uploadAvatar = async (
    userId: string,
    file: File
  ): Promise<string> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(
        'ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้'
      );
    }

    if (!session?.user) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่'
      );
    }

    if (
      session.user.id !== userId
    ) {
      throw new Error(
        'บัญชีผู้ใช้ไม่ตรงกับโปรไฟล์'
      );
    }

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() || 'jpg';

    const filePath =
      `${session.user.id}/${crypto.randomUUID()}.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from('profile-images')
      .upload(
        filePath,
        file,
        {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        }
      );

    if (uploadError) {
      console.error(
        'UPLOAD AVATAR ERROR:',
        uploadError
      );

      throw new Error(
        `ไม่สามารถอัปโหลดรูปโปรไฟล์ได้: ${uploadError.message}`
      );
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const saveProfileAutomatically =
    useCallback(
      async () => {
        if (
          !profile ||
          autoSavingRef.current
        ) {
          return;
        }

        const formHasChanged =
          JSON.stringify(form) !==
          JSON.stringify(
            lastSavedFormRef.current
          );

        if (
          !formHasChanged &&
          !selectedAvatar
        ) {
          return;
        }

        if (
          !form.firstName.trim() ||
          !form.lastName.trim()
        ) {
          return;
        }

        try {
          autoSavingRef.current =
            true;

          setError('');

          let avatarUrl =
            profile.avatar_url || '';

          if (selectedAvatar) {
            avatarUrl =
              await uploadAvatar(
                profile.id,
                selectedAvatar
              );
          }

          await ProfileService.updateProfile(
            profile.id,
            {
              firstName:
                form.firstName,

              lastName:
                form.lastName,

              displayName:
                form.displayName,

              phone:
                form.phone,

              bio:
                form.bio,

              avatarUrl,
            }
          );

          lastSavedFormRef.current = {
            ...form,
          };

          setProfile(
            (
              current
            ) =>
              current
                ? {
                    ...current,
                    first_name:
                      form.firstName,
                    last_name:
                      form.lastName,
                    display_name:
                      form.displayName,
                    phone:
                      form.phone,
                    bio:
                      form.bio,
                    avatar_url:
                      avatarUrl,
                  }
                : current
          );

          if (selectedAvatar) {
            setSelectedAvatar(null);

            setAvatarPreview(
              avatarUrl
            );
          }
        } catch (err) {
          console.error(
            'AUTO SAVE PROFILE ERROR:',
            err
          );

          setToastType('error');

          setMessage(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้'
          );
        } finally {
          autoSavingRef.current =
            false;
        }
      },
      [
        profile,
        form,
        selectedAvatar,
      ]
    );

  useEffect(() => {
    if (!profile) {
      return;
    }

    const formHasChanged =
      JSON.stringify(form) !==
      JSON.stringify(
        lastSavedFormRef.current
      );

    if (
      !formHasChanged &&
      !selectedAvatar
    ) {
      return;
    }

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      return;
    }

    if (
      autoSaveTimerRef.current
    ) {
      clearTimeout(
        autoSaveTimerRef.current
      );
    }

    autoSaveTimerRef.current =
      setTimeout(() => {
        void saveProfileAutomatically();
      }, 700);

    return () => {
      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );
      }
    };
  }, [
    profile,
    form,
    selectedAvatar,
    saveProfileAutomatically,
  ]);


  const updateNotificationPreference = async (
    key: keyof NotificationPreferences,
    checked: boolean
  ) => {
    const previousPreferences =
      notificationPreferences;

    const nextPreferences = {
      ...notificationPreferences,
      [key]: checked,
    };

    // อัปเดตหน้าจอทันที
    setNotificationPreferences(nextPreferences);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          data: {
            notification_preferences:
              nextPreferences,
          },
        });

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error(
        'AUTO SAVE NOTIFICATION SETTINGS ERROR:',
        err
      );

      // หากบันทึกไม่สำเร็จ ให้คืนค่าก่อนหน้า
      setNotificationPreferences(
        previousPreferences
      );

      setToastType('error');
      setMessage(
        'ไม่สามารถอัปเดตการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง'
      );
    }
  };

  const handleChangePassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const newPassword =
      passwordForm.newPassword.trim();

    const confirmPassword =
      passwordForm.confirmPassword.trim();

    if (newPassword.length < 8) {
      setToastType('error');
      setMessage(
        'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastType('error');
      setMessage(
        'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน'
      );
      return;
    }

    try {
      setChangingPassword(true);

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      setPasswordForm(initialPasswordForm);

      setToastType('success');
      setMessage(
        'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
      );
    } catch (err) {
      console.error(
        'CHANGE PASSWORD ERROR:',
        err
      );

      setToastType('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเปลี่ยนรหัสผ่านได้'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-75 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs font-medium text-slate-400">
            กำลังโหลดข้อมูลโปรไฟล์...
          </p>
        </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <section className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/35 blur-2xl" />
        <div className="relative inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
          <UserRound className="h-3.5 w-3.5" />
          My Profile
        </div>

        <h1 className="relative mt-3 text-2xl font-black tracking-tight text-[#2E1065] sm:text-3xl">
          โปรไฟล์ของฉัน
        </h1>

        <p className="relative mt-2 max-w-xl text-sm font-medium leading-6 text-purple-950/60">
          จัดการข้อมูลส่วนตัวและรูปโปรไฟล์สำหรับบัญชีเจ้าของสัตว์เลี้ยง
        </p>
      </section>

      {message && (
        <div
          className={`fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-xs font-bold shadow-lg sm:right-6 ${
            toastType === 'success'
              ? 'border-emerald-200 bg-white text-emerald-700'
              : 'border-rose-200 bg-white text-rose-700'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <span className="leading-5">{message}</span>
        </div>
      )}

      {error && !message && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT PROFILE CARD */}
        <section className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
          <div className="text-center">
            <div className="relative mx-auto h-32 w-32">
              <div className="h-32 w-32 overflow-hidden rounded-[30px] border-4 border-white bg-purple-100 shadow-[0_10px_30px_rgba(76,29,149,0.12)]">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-purple-400">
                    <UserRound className="h-14 w-14" />
                  </div>
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)] transition hover:bg-purple-700">
                <Camera className="h-4 w-4" />

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleAvatarChange
                  }
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="mt-5 text-lg font-black text-purple-950">
              {profile.display_name ||
                `${profile.first_name || ''} ${profile.last_name || ''}`.trim()}
            </h2>

            <p className="mt-1 text-xs font-bold text-purple-500">
              เจ้าของสัตว์เลี้ยง
            </p>

            <div className="mt-5 space-y-3 rounded-[20px] bg-[#F8F4FF] p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Mail className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400">
                    อีเมล
                  </div>

                  <div className="truncate text-xs font-medium text-slate-700">
                    {profile.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                  <Phone className="h-4 w-4" />
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400">
                    เบอร์โทร
                  </div>

                  <div className="text-xs font-medium text-slate-700">
                    {profile.phone ||
                      'ยังไม่ได้ระบุ'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT FORM */}
        <section className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,0.05)] lg:col-span-2">
          <div className="mb-5">
            <h2 className="font-black text-purple-950">
              แก้ไขข้อมูลส่วนตัว
            </h2>

            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              ระบบบันทึกการเปลี่ยนแปลงให้อัตโนมัติ
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="ชื่อ"
                value={form.firstName}
                onChange={(value) =>
                  setForm({
                    ...form,
                    firstName: value,
                  })
                }
                required
              />

              <Field
                label="นามสกุล"
                value={form.lastName}
                onChange={(value) =>
                  setForm({
                    ...form,
                    lastName: value,
                  })
                }
                required
              />
            </div>

            <Field
              label="ชื่อที่แสดง"
              value={form.displayName}
              onChange={(value) =>
                setForm({
                  ...form,
                  displayName: value,
                })
              }
              placeholder="เช่น ใบหม่อน"
            />

            <Field
              label="เบอร์โทรศัพท์"
              value={form.phone}
              onChange={(value) =>
                setForm({
                  ...form,
                  phone: value,
                })
              }
              type="tel"
              placeholder="08xxxxxxxx"
            />

            <div>
              <label className="mb-1.5 block text-xs font-bold text-purple-950">
                อีเมล
              </label>

              <input
                value={profile.email}
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400"
              />

              <p className="mt-1.5 text-[10px] text-slate-400">
                อีเมลใช้สำหรับเข้าสู่ระบบ จึงยังไม่แก้ไขจากหน้านี้
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-purple-950">
                เกี่ยวกับฉัน
              </label>

              <textarea
                value={form.bio}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bio: event.target.value,
                  })
                }
                rows={5}
                placeholder="แนะนำตัวสั้นๆ..."
                className="w-full resize-none rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              />
            </div>

          </div>
        </section>
      </div>

      {/* ACCOUNT SETTINGS */}
      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-2">
        {/* Notification settings */}
        <section className="flex h-full flex-col rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Bell className="h-5 w-5" />
              </div>

              <div>
              <h2 className="font-black text-purple-950">
                การแจ้งเตือน
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                เลือกประเภทการแจ้งเตือนที่ต้องการรับ
              </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex-1 space-y-2.5">
            <NotificationToggle
              title="อัปเดตสถานะการจอง"
              description="แจ้งเมื่อผู้รับฝากตอบรับ ปฏิเสธ หรือสถานะการจองเปลี่ยน"
              checked={notificationPreferences.bookingUpdates}
              onChange={(checked) =>
                void updateNotificationPreference(
                  'bookingUpdates',
                  checked
                )
              }
            />

            <NotificationToggle
              title="อัปเดตการดูแลสัตว์เลี้ยง"
              description="แจ้งเมื่อผู้รับฝากเพิ่มรายงานการดูแลหรือรูปภาพ"
              checked={notificationPreferences.careUpdates}
              onChange={(checked) =>
                void updateNotificationPreference(
                  'careUpdates',
                  checked
                )
              }
            />

            <NotificationToggle
              title="รีวิวและการให้คะแนน"
              description="แจ้งเตือนเมื่อมีรายการที่พร้อมให้คะแนนและรีวิว"
              checked={notificationPreferences.reviewUpdates}
              onChange={(checked) =>
                void updateNotificationPreference(
                  'reviewUpdates',
                  checked
                )
              }
            />
          </div>

        </section>

        {/* Password */}
        <section className="flex h-full flex-col rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <KeyRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-purple-950">
                เปลี่ยนรหัสผ่าน
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร
              </p>
            </div>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="mt-5 flex flex-1 flex-col"
          >
            <div className="space-y-4">
              <PasswordField
                label="รหัสผ่านใหม่"
                value={passwordForm.newPassword}
                showPassword={showNewPassword}
                onToggleShow={() =>
                  setShowNewPassword((current) => !current)
                }
                onChange={(value) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: value,
                  }))
                }
                placeholder="กรอกรหัสผ่านใหม่"
              />

              <PasswordField
                label="ยืนยันรหัสผ่านใหม่"
                value={passwordForm.confirmPassword}
                showPassword={showConfirmPassword}
                onToggleShow={() =>
                  setShowConfirmPassword((current) => !current)
                }
                onChange={(value) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: value,
                  }))
                }
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              />
            </div>

            <div className="mt-auto flex justify-end border-t border-purple-100 pt-5">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-5 py-3 text-xs font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.20)] transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        </section>
      </div>
      </div>
    </main>
  );
}


function NotificationToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[20px] bg-[#F8F4FF] px-4 py-3 transition hover:bg-purple-50">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-800">
          {title}
        </div>

        <div className="mt-1 text-[10px] leading-4 text-slate-400">
          {description}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-purple-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-5.5' : 'left-0.5'
          }`}
        />
      </button>
    </label>
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
  onChange: (value: string) => void;
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
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600"
          aria-label={
            showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'
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
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-purple-950">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
      />
    </div>
  );
}
