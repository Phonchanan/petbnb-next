'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  PawPrint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import {
  AuthService,
} from '@/lib/auth';

export default function LoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  /* =========================================
   * AUTO HIDE ERROR
   * ======================================= */

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setErrorMessage('');
        },
        4500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [errorMessage]);

  /* =========================================
   * LOGIN
   * ======================================= */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setErrorMessage('');

      const cleanEmail =
        email.trim();

      if (!cleanEmail) {
        setErrorMessage(
          'กรุณากรอกอีเมล'
        );

        return;
      }

      if (!password) {
        setErrorMessage(
          'กรุณากรอกรหัสผ่าน'
        );

        return;
      }

      try {
        setIsLoading(true);

        await AuthService.signIn(
          cleanEmail,
          password
        );

        const profile =
          await AuthService.getCurrentProfile();

        if (!profile) {
          throw new Error(
            'ไม่พบข้อมูลโปรไฟล์ผู้ใช้งาน'
          );
        }

        if (
          !profile.is_active
        ) {
          await AuthService.signOut();

          throw new Error(
            'บัญชีนี้ถูกระงับการใช้งาน'
          );
        }

        const role =
          profile.role
            .trim()
            .toUpperCase();

        if (
          role ===
          'ADMIN'
        ) {
          router.push(
            '/admin'
          );

          return;
        }

        if (
          role ===
          'SITTER'
        ) {
          router.push(
            '/sitter'
          );

          return;
        }

        router.push(
          '/owner'
        );
      } catch (error) {
        console.error(
          'LOGIN ERROR:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : '';

        const lowerMessage =
          message.toLowerCase();

        /* =====================================
         * WRONG EMAIL / PASSWORD
         * =================================== */

        if (
          lowerMessage.includes(
            'invalid login credentials'
          ) ||
          lowerMessage.includes(
            'invalid credentials'
          )
        ) {
          setErrorMessage(
            'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง'
          );

          return;
        }

        /* =====================================
         * EMAIL NOT CONFIRMED
         * =================================== */

        if (
          lowerMessage.includes(
            'email not confirmed'
          )
        ) {
          setErrorMessage(
            'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
          );

          return;
        }

        /* =====================================
         * RATE LIMIT
         * =================================== */

        if (
          lowerMessage.includes(
            'too many requests'
          ) ||
          lowerMessage.includes(
            'rate limit'
          )
        ) {
          setErrorMessage(
            'มีการพยายามเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่แล้วลองใหม่'
          );

          return;
        }

        /* =====================================
         * CUSTOM ERROR
         * =================================== */

        if (
          message ===
            'บัญชีนี้ถูกระงับการใช้งาน' ||
          message ===
            'ไม่พบข้อมูลโปรไฟล์ผู้ใช้งาน'
        ) {
          setErrorMessage(
            message
          );

          return;
        }

        /* =====================================
         * OTHER ERROR
         * =================================== */

        setErrorMessage(
          'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง'
        );
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF7FE] px-4 py-10">
      {/* =====================================
       * ERROR TOAST
       * =================================== */}

      {errorMessage && (
        <div className="fixed right-4 top-4 z-9999 w-[calc(100%-2rem)] max-w-sm">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-4 shadow-xl shadow-rose-100/50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50">
              <AlertCircle className="h-5 w-5 text-rose-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-rose-700">
                เข้าสู่ระบบไม่สำเร็จ
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setErrorMessage('')
              }
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              aria-label="ปิดข้อความแจ้งเตือน"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="rounded-4xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-200/40 sm:p-8">
          {/* =================================
           * LOGO
           * =============================== */}

          <div className="mb-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-linear-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-200">
              <PawPrint className="h-8 w-8" />
            </div>

            <h1 className="mt-4 text-2xl font-extrabold text-[#2E1065]">
              ยินดีต้อนรับกลับมา
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              เข้าสู่ระบบเพื่อดูแลทุกเรื่องของน้องๆ บน PetBnB
            </p>
          </div>

          {/* =================================
           * FORM
           * =============================== */}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-4"
          >
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-bold text-purple-950"
              >
                อีเมล
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) => {
                    setEmail(
                      event
                        .target
                        .value
                    );

                    if (
                      errorMessage
                    ) {
                      setErrorMessage(
                        ''
                      );
                    }
                  }}
                  required
                  autoComplete="email"
                  placeholder="example@email.com"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold text-purple-950"
              >
                รหัสผ่าน
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) => {
                    setPassword(
                      event
                        .target
                        .value
                    );

                    if (
                      errorMessage
                    ) {
                      setErrorMessage(
                        ''
                      );
                    }
                  }}
                  required
                  autoComplete="current-password"
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 transition hover:text-purple-600"
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

            {/* =================================
             * LOGIN BUTTON
             * =============================== */}

            <button
              type="submit"
              disabled={
                isLoading
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:from-purple-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ

                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* =================================
           * SIGN UP
           * =============================== */}

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