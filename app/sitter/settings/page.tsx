'use client';

import {
  Bell,
  KeyRound,
  Loader2,
  LogOut,
  Save,
  Settings,
  UserRound,
} from 'lucide-react';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

interface SettingsForm {
  displayName: string;
  phone: string;
  emailNotifications: boolean;
}

const initialForm: SettingsForm = {
  displayName: '',
  phone: '',
  emailNotifications: true,
};

export default function SitterSettingsPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<SettingsForm>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [email, setEmail] =
    useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const current =
          await AuthService.getCurrentProfile();

        if (!current) {
          router.replace('/login');
          return;
        }

        if (
          current.role.toUpperCase() !==
          'SITTER'
        ) {
          router.replace('/');
          return;
        }

        setEmail(
          current.email || ''
        );

        setForm({
          displayName:
            current.display_name || '',

          phone:
            current.phone || '',

          emailNotifications:
            true,
        });
      } catch (err) {
        console.error(
          'LOAD SETTINGS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดการตั้งค่าได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const {
        error: updateError,
      } = await supabase
        .from('profiles')
        .update({
          display_name:
            form.displayName.trim(),

          phone:
            form.phone.trim(),

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setMessage(
        'บันทึกการตั้งค่าเรียบร้อยแล้ว'
      );
    } catch (err) {
      console.error(
        'SAVE SETTINGS ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถบันทึกการตั้งค่าได้'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword =
    async () => {
      try {
        setError('');
        setMessage('');

        if (!email) {
          setError(
            'ไม่พบอีเมลของบัญชี'
          );
          return;
        }

        const {
          error: resetError,
        } =
          await supabase.auth.resetPasswordForEmail(
            email,
            {
              redirectTo:
                `${window.location.origin}/reset-password`,
            }
          );

        if (resetError) {
          throw new Error(
            resetError.message
          );
        }

        setMessage(
          'ส่งลิงก์เปลี่ยนรหัสผ่านไปยังอีเมลแล้ว'
        );
      } catch (err) {
        console.error(
          'RESET PASSWORD ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถส่งลิงก์เปลี่ยนรหัสผ่านได้'
        );
      }
    };

  const handleLogout =
    async () => {
      try {
        setLoggingOut(true);
        setError('');

        const {
          error: logoutError,
        } =
          await supabase.auth.signOut();

        if (logoutError) {
          throw new Error(
            logoutError.message
          );
        }

        router.replace('/login');
        router.refresh();
      } catch (err) {
        console.error(
          'LOGOUT ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถออกจากระบบได้'
        );
      } finally {
        setLoggingOut(false);
      }
    };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดการตั้งค่า...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* HEADER */}
      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <Settings className="h-6 w-6" />
          </div>

          <div>
            <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              Settings
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              การตั้งค่าบัญชี
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              จัดการข้อมูลบัญชี รหัสผ่าน
              การแจ้งเตือน และการออกจากระบบ
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* ACCOUNT */}
      <form
        onSubmit={handleSave}
        className="mt-6 rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <UserRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-black text-purple-950">
              ข้อมูลบัญชี
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              ข้อมูลทั่วไปที่ใช้ในระบบ
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-purple-950">
              อีเมล
            </label>

            <input
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-purple-950">
              ชื่อที่แสดง
            </label>

            <input
              value={
                form.displayName
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  displayName:
                    event.target.value,
                })
              }
              className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-purple-950">
              เบอร์โทรศัพท์
            </label>

            <input
              type="tel"
              value={
                form.phone
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  phone:
                    event.target.value,
                })
              }
              className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              บันทึก
            </>
          )}
        </button>
      </form>

      {/* PASSWORD */}
      <section className="mt-6 rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <KeyRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-black text-purple-950">
              รหัสผ่าน
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              เปลี่ยนรหัสผ่านผ่านอีเมลที่สมัคร
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            handleChangePassword
          }
          className="mt-5 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-xs font-bold text-purple-700"
        >
          ส่งลิงก์เปลี่ยนรหัสผ่าน
        </button>
      </section>

      {/* NOTIFICATIONS */}
      <section className="mt-6 rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-black text-purple-950">
              การแจ้งเตือน
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              ตั้งค่าการรับข้อมูลจาก PetBnB
            </p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-purple-100 bg-[#FAF8FE] p-4">
          <input
            type="checkbox"
            checked={
              form.emailNotifications
            }
            onChange={(event) =>
              setForm({
                ...form,
                emailNotifications:
                  event.target.checked,
              })
            }
            className="mt-0.5 h-4 w-4 accent-purple-600"
          />

          <div>
            <div className="text-sm font-bold text-purple-950">
              รับการแจ้งเตือนผ่านอีเมล
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              เช่น มีคำขอจองใหม่
              สถานะการจองเปลี่ยนแปลง
              และประกาศสำคัญจากระบบ
            </p>
          </div>
        </label>

        <p className="mt-3 text-[10px] text-slate-400">
          ตอนนี้ตัวเลือกนี้เป็นส่วน UI ก่อน
          หากต้องการบันทึกจริงควรเพิ่มคอลัมน์ notification settings ในฐานข้อมูล
        </p>
      </section>

      {/* LOGOUT */}
      <section className="mt-6 rounded-[28px] border border-rose-100 bg-white p-6 shadow-sm">
        <h2 className="font-black text-rose-700">
          ออกจากระบบ
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          หลังออกจากระบบ คุณจะต้องเข้าสู่ระบบใหม่เพื่อใช้งานบัญชี Sitter
        </p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-5 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          {loggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังออกจากระบบ...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </>
          )}
        </button>
      </section>
    </main>
  );
}