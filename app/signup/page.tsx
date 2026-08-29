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
  CheckCircle2,
  User,
  Phone,
  Heart,
  Home,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import {
  AuthService,
  type UserRole,
} from '@/lib/auth';

type SignUpRole =
  Exclude<UserRole, 'ADMIN'>;

export default function SignUpPage() {
  const router = useRouter();

  const [
    firstName,
    setFirstName,
  ] = useState('');

  const [
    lastName,
    setLastName,
  ] = useState('');

  const [
    displayName,
    setDisplayName,
  ] = useState('');

  const [
    phone,
    setPhone,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    role,
    setRole,
  ] =
    useState<SignUpRole>('OWNER');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  /* =========================================
   * AUTO HIDE ERROR
   * ======================================= */

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setErrorMessage('');
      }, 5000);

    return () =>
      window.clearTimeout(timer);
  }, [errorMessage]);

  /* =========================================
   * VALIDATE PHONE
   * ======================================= */

  const validatePhone = (
    value: string
  ) => {
    if (!value) {
      return true;
    }

    return /^[0-9]{9,10}$/.test(
      value
    );
  };

  /* =========================================
   * SIGN UP
   * ======================================= */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setErrorMessage('');
      setSuccessMessage('');

      const cleanFirstName =
        firstName.trim();

      const cleanLastName =
        lastName.trim();

      const cleanDisplayName =
        displayName.trim();

      const cleanPhone =
        phone
          .replace(/\s/g, '')
          .replace(/-/g, '');

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanFirstName) {
        setErrorMessage(
          'กรุณากรอกชื่อ'
        );

        return;
      }

      if (!cleanLastName) {
        setErrorMessage(
          'กรุณากรอกนามสกุล'
        );

        return;
      }

      if (!cleanEmail) {
        setErrorMessage(
          'กรุณากรอกอีเมล'
        );

        return;
      }

      if (
        cleanPhone &&
        !validatePhone(cleanPhone)
      ) {
        setErrorMessage(
          'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง'
        );

        return;
      }

      if (!password) {
        setErrorMessage(
          'กรุณากรอกรหัสผ่าน'
        );

        return;
      }

      if (password.length < 6) {
        setErrorMessage(
          'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        );

        return;
      }

      if (!confirmPassword) {
        setErrorMessage(
          'กรุณายืนยันรหัสผ่าน'
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'
        );

        return;
      }

      try {
        setIsLoading(true);

        const data =
          await AuthService.signUp({
            email: cleanEmail,
            password,
            firstName:
              cleanFirstName,
            lastName:
              cleanLastName,
            displayName:
              cleanDisplayName ||
              `${cleanFirstName} ${cleanLastName}`,
            phone:
              cleanPhone ||
              undefined,
            role,
          });

        /*
         * ถ้าเปิด Email Confirmation
         * Supabase มักจะยังไม่มี session
         */
        if (!data.session) {
          setSuccessMessage(
            'สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ'
          );

          window.setTimeout(
            () => {
              router.push(
                '/signin'
              );
            },
            2500
          );

          return;
        }

        /*
         * ถ้าไม่ได้เปิด Email Confirmation
         * สมัครสำเร็จและมี session ทันที
         */
        setSuccessMessage(
          'สมัครสมาชิกสำเร็จ กำลังพาไปยังหน้าหลัก...'
        );

        window.setTimeout(() => {
          if (role === 'SITTER') {
            router.push(
              '/sitter'
            );

            return;
          }

          router.push(
            '/owner'
          );
        }, 1200);
      } catch (error) {
        console.error(
          'SIGNUP ERROR:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : '';

        const lowerMessage =
          message.toLowerCase();

        /* =====================================
         * USER ALREADY EXISTS
         * =================================== */

        if (
          lowerMessage.includes(
            'user already registered'
          ) ||
          lowerMessage.includes(
            'already registered'
          ) ||
          lowerMessage.includes(
            'already been registered'
          )
        ) {
          setErrorMessage(
            'อีเมลนี้ถูกสมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น'
          );

          return;
        }

        /* =====================================
         * INVALID EMAIL
         * =================================== */

        if (
          lowerMessage.includes(
            'invalid email'
          )
        ) {
          setErrorMessage(
            'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
          );

          return;
        }

        /* =====================================
         * WEAK PASSWORD
         * =================================== */

        if (
          lowerMessage.includes(
            'password'
          ) &&
          (
            lowerMessage.includes(
              'weak'
            ) ||
            lowerMessage.includes(
              'least'
            )
          )
        ) {
          setErrorMessage(
            'รหัสผ่านไม่ผ่านเงื่อนไข กรุณาใช้รหัสผ่านที่มีความปลอดภัยมากขึ้น'
          );

          return;
        }

        /* =====================================
         * RATE LIMIT
         * =================================== */

        if (
          lowerMessage.includes(
            'rate limit'
          ) ||
          lowerMessage.includes(
            'too many requests'
          )
        ) {
          setErrorMessage(
            'มีการสมัครสมาชิกหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่'
          );

          return;
        }

        /* =====================================
         * DATABASE ERROR
         * =================================== */

        if (
          lowerMessage.includes(
            'database error'
          )
        ) {
          setErrorMessage(
            'ไม่สามารถบันทึกข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง'
          );

          return;
        }

        /* =====================================
         * OTHER ERROR
         * =================================== */

        setErrorMessage(
          message ||
            'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง'
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
                สมัครสมาชิกไม่สำเร็จ
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

      {/* =====================================
       * SUCCESS TOAST
       * =================================== */}

      {successMessage && (
        <div className="fixed right-4 top-4 z-9999 w-[calc(100%-2rem)] max-w-sm">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl shadow-emerald-100/50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-emerald-700">
                สมัครสมาชิกสำเร็จ
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl">
        <div className="rounded-4xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-200/40 sm:p-8">
          {/* =================================
           * LOGO
           * =============================== */}

          <div className="mb-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-linear-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-200">
              <PawPrint className="h-8 w-8" />
            </div>

            <h1 className="mt-4 text-2xl font-extrabold text-[#2E1065]">
              สมัครสมาชิก PetBnB
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              สร้างบัญชีเพื่อเริ่มใช้งาน
              PetBnB
            </p>
          </div>

          {/* =================================
           * ROLE
           * =============================== */}

          <div className="mb-6">
            <p className="mb-2 text-xs font-bold text-purple-950">
              สมัครใช้งานในฐานะ
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setRole('OWNER')
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  role === 'OWNER'
                    ? 'border-purple-400 bg-purple-50 ring-4 ring-purple-100'
                    : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      role ===
                      'OWNER'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-500'
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-purple-950">
                      เจ้าของสัตว์
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      OWNER
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setRole('SITTER')
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  role === 'SITTER'
                    ? 'border-purple-400 bg-purple-50 ring-4 ring-purple-100'
                    : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      role ===
                      'SITTER'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-500'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-purple-950">
                      ผู้รับฝาก
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      SITTER
                    </p>
                  </div>
                </div>
              </button>
            </div>
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
            {/* FIRST / LAST NAME */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1.5 block text-xs font-bold text-purple-950"
                >
                  ชื่อ
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                  <input
                    id="firstName"
                    type="text"
                    value={
                      firstName
                    }
                    onChange={(
                      event
                    ) =>
                      setFirstName(
                        event
                          .target
                          .value
                      )
                    }
                    required
                    autoComplete="given-name"
                    placeholder="ชื่อ"
                    className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1.5 block text-xs font-bold text-purple-950"
                >
                  นามสกุล
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                  <input
                    id="lastName"
                    type="text"
                    value={
                      lastName
                    }
                    onChange={(
                      event
                    ) =>
                      setLastName(
                        event
                          .target
                          .value
                      )
                    }
                    required
                    autoComplete="family-name"
                    placeholder="นามสกุล"
                    className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>
            </div>

            {/* DISPLAY NAME */}

            <div>
              <label
                htmlFor="displayName"
                className="mb-1.5 block text-xs font-bold text-purple-950"
              >
                ชื่อที่แสดง
                <span className="ml-1 font-normal text-slate-400">
                  (ไม่บังคับ)
                </span>
              </label>

              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                <input
                  id="displayName"
                  type="text"
                  value={
                    displayName
                  }
                  onChange={(
                    event
                  ) =>
                    setDisplayName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="เช่น ใบหม่อน"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* PHONE */}

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-xs font-bold text-purple-950"
              >
                เบอร์โทรศัพท์
                <span className="ml-1 font-normal text-slate-400">
                  (ไม่บังคับ)
                </span>
              </label>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(
                    event
                  ) =>
                    setPhone(
                      event
                        .target
                        .value
                    )
                  }
                  autoComplete="tel"
                  placeholder="08xxxxxxxx"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

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
                  ) =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                  }
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
                  value={password}
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
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

            {/* CONFIRM PASSWORD */}

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-bold text-purple-950"
              >
                ยืนยันรหัสผ่าน
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setConfirmPassword(
                      event
                        .target
                        .value
                    )
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] py-3 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 transition hover:text-purple-600"
                  aria-label={
                    showConfirmPassword
                      ? 'ซ่อนรหัสผ่าน'
                      : 'แสดงรหัสผ่าน'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* =================================
             * SIGN UP BUTTON
             * =============================== */}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:from-purple-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  กำลังสมัครสมาชิก...
                </>
              ) : (
                <>
                  สมัครสมาชิก

                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* =================================
           * LOGIN
           * =============================== */}

          <div className="mt-6 text-center text-xs text-slate-500">
            มีบัญชีอยู่แล้ว?{' '}

            <Link
              href="/login"
              className="font-bold text-purple-700 hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
          การสมัครสมาชิกหมายถึงคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของ PetBnB
        </p>
      </div>
    </main>
  );
}