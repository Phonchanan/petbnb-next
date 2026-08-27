/* eslint-disable @next/next/no-location-assign-relative-destination */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Save,
  UserRound,
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

const initialForm: ProfileFormState = {
  firstName: '',
  lastName: '',
  displayName: '',
  phone: '',
  bio: '',
};

export default function OwnerProfilePage() {
  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [form, setForm] =
    useState<ProfileFormState>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

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

      setForm({
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
      });

      setAvatarPreview(
        current.avatar_url || null
      );
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

  const handleSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!profile) {
      return;
    }

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      setError(
        'กรุณากรอกชื่อและนามสกุล'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

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

      setMessage(
        'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว ✨'
      );

      setSelectedAvatar(null);

      await loadProfile();
    } catch (err) {
      console.error(
        'SAVE PROFILE ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-75 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs font-medium text-slate-400">
            กำลังโหลดข้อมูลโปรไฟล์...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
          <UserRound className="h-3.5 w-3.5" />
          My Profile
        </div>

        <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
          โปรไฟล์ของฉัน
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          จัดการข้อมูลส่วนตัวและรูปโปรไฟล์สำหรับบัญชีเจ้าของสัตว์เลี้ยง
        </p>
      </section>

      {message && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT PROFILE CARD */}
        <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="relative mx-auto h-32 w-32">
              <div className="h-32 w-32 overflow-hidden rounded-4xl border-4 border-purple-50 bg-purple-100 shadow-md">
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

              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700">
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

            <div className="mt-5 space-y-3 rounded-2xl bg-[#FAF7FE] p-4 text-left">
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
        <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5">
            <h2 className="font-black text-purple-950">
              แก้ไขข้อมูลส่วนตัว
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              ข้อมูลนี้จะถูกบันทึกลง Supabase
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className="space-y-5"
          >
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

            {selectedAvatar && (
              <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-xs text-purple-700">
                เลือกรูปใหม่แล้ว: {selectedAvatar.name}
              </div>
            )}

            <div className="flex justify-end border-t border-purple-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
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