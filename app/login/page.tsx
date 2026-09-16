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
    <main className="min-h-screen bg-[#F8F4FC]">
      {/* ERROR TOAST */}
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

      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        {/* LEFT VISUAL */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#F5E9FF] via-[#F8ECF4] to-[#FFF3E8] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-[-40px] h-80 w-80 rounded-full bg-purple-200/35 blur-3xl" />

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
                <PawPrint className="h-5 w-5" />
              </div>

              <div>
                <p className="text-lg font-black leading-none text-purple-950">
                  PetBnB
                </p>

                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-purple-400">
                  Pet Care Platform
                </p>
              </div>
            </Link>

            <div className="mt-14 max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-400">
                Welcome back
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight text-[#2E1065] xl:text-5xl">
                ยินดีต้อนรับกลับสู่
                <span className="block text-purple-600">
                  PetBnB
                </span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-7 text-purple-950/55">
                กลับมาจัดการการจอง ดูแลน้อง ๆ และเชื่อมต่อกับคนรักสัตว์ได้จากที่เดียว
              </p>
            </div>
          </div>

          {/* ILLUSTRATION-LIKE PANEL */}
          <div className="relative z-10 mx-auto mt-10 w-full max-w-xl">
            <div className="relative overflow-hidden rounded-[36px] bg-white/45 p-7 shadow-[0_30px_80px_rgba(88,28,135,0.10)] backdrop-blur-sm">
              <div className="absolute right-7 top-7 h-24 w-20 rounded-t-[42px] rounded-b-[18px] border-8 border-white/80 bg-sky-100/80">
                <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/80" />
                <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-white/80" />
              </div>

              <div className="flex min-h-[310px] items-end gap-5">
                <div className="relative flex-1">
                  <div className="absolute bottom-28 left-2 h-20 w-12 rounded-t-full bg-emerald-200/80" />
                  <div className="absolute bottom-24 left-10 h-16 w-4 rotate-12 rounded-full bg-emerald-300/80" />

                  <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-[#E7D8FF] shadow-inner">
                    <div className="text-[86px] leading-none">
                      🐶
                    </div>
                  </div>

                  <div className="mx-auto mt-[-16px] h-16 w-52 rounded-[24px] bg-[#CDB4FF] shadow-md" />
                </div>

                <div className="w-40 space-y-3">
                  <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-purple-400">
                      Trusted care
                    </p>

                    <p className="mt-2 text-xs font-black text-purple-950">
                      ปลอดภัย ใส่ใจ และติดตามได้
                    </p>
                  </div>

                  <div className="rounded-[24px] bg-[#FFF4D8] p-4 shadow-sm">
                    <p className="text-xs font-black text-amber-800">
                      🐾 สำหรับ Owner & Sitter
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT FORM */}
        <section className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-8 lg:px-10 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
                  <PawPrint className="h-5 w-5" />
                </div>

                <span className="text-lg font-black text-purple-950">
                  PetBnB
                </span>
              </Link>
            </div>

            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#2E1065]">
                เข้าสู่ระบบ
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่บัญชีของคุณ
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-black text-slate-600"
                >
                  อีเมล
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(
                        event.target.value
                      );

                      if (errorMessage) {
                        setErrorMessage('');
                      }
                    }}
                    required
                    autoComplete="email"
                    placeholder="example@email.com"
                    className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-black text-slate-600"
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
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value
                      );

                      if (errorMessage) {
                        setErrorMessage('');
                      }
                    }}
                    required
                    autoComplete="current-password"
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
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

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)] transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="mt-7 border-t border-purple-50 pt-6 text-center text-xs text-slate-500">
              ยังไม่มีบัญชี?{' '}

              <Link
                href="/signup"
                className="font-black text-purple-700 hover:underline"
              >
                สมัครสมาชิก
              </Link>
            </div>

            <p className="mt-8 text-center text-[10px] leading-5 text-slate-300">
              PetBnB • พื้นที่สำหรับคนรักสัตว์
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}