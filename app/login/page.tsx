'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PawPrint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      setIsLoading(true);

      await AuthService.signIn(email.trim(), password);

      const profile =
        await AuthService.getCurrentProfile();

      if (!profile) {
        throw new Error('ไม่พบข้อมูลโปรไฟล์ผู้ใช้งาน');
      }

      if (!profile.is_active) {
        await AuthService.signOut();
        throw new Error('บัญชีนี้ถูกระงับการใช้งาน');
      }

      const role = profile.role.toUpperCase();

      if (role === 'ADMIN') {
        router.push('/admin');
      } else if (role === 'SITTER') {
        router.push('/sitter');
      } else {
        router.push('/owner');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถเข้าสู่ระบบได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7FE] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-4xl border border-purple-100 shadow-2xl shadow-purple-200/40 p-6 sm:p-8">

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <PawPrint className="w-8 h-8" />
            </div>

            <h1 className="mt-4 text-2xl font-extrabold text-[#2E1065]">
              ยินดีต้อนรับกลับมา
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              เข้าสู่ระบบเพื่อดูแลทุกเรื่องของน้องๆ บน PetBnB
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1.5">
                อีเมล
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  placeholder="example@email.com"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] pl-11 pr-4 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1.5">
                รหัสผ่าน
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] pl-11 pr-12 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white py-3.5 text-sm font-bold shadow-lg shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            ยังไม่มีบัญชี?{' '}
            <Link
              href="/signup"
              className="font-bold text-purple-700 hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}