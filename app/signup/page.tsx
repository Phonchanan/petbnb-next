'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  PawPrint,
  UserRound,
  Home,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { AuthService } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] =
    useState<'OWNER' | 'SITTER'>('OWNER');

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [displayName, setDisplayName] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage(
        'กรุณากรอกชื่อและนามสกุล'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'
      );
      return;
    }

    try {
      setIsLoading(true);

      const result =
        await AuthService.signUp({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          displayName:
            displayName.trim() ||
            `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim(),
          role,
        });

      if (!result.user) {
        throw new Error(
          'ไม่สามารถสร้างบัญชีผู้ใช้ได้'
        );
      }

      if (!result.session) {
        setSuccessMessage(
          'สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ'
        );
        return;
      }

      router.push(
        role === 'SITTER'
          ? '/sitter'
          : '/owner'
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7FE] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-4xl border border-purple-100 shadow-2xl shadow-purple-200/40 p-6 sm:p-8">

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <PawPrint className="w-8 h-8" />
            </div>

            <h1 className="mt-4 text-2xl font-extrabold text-[#2E1065]">
              สมัครสมาชิก PetBnB
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              เลือกประเภทบัญชีและกรอกข้อมูลเพื่อเริ่มต้นใช้งาน
            </p>
          </div>

          {/* Role */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() =>
                setRole('OWNER')
              }
              className={`rounded-2xl border p-4 text-left transition ${
                role === 'OWNER'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                  : 'border-purple-100 bg-[#FAF8FE] hover:border-purple-300'
              }`}
            >
              <UserRound className="w-5 h-5 text-purple-600 mb-2" />

              <div className="text-sm font-bold text-purple-950">
                เจ้าของสัตว์เลี้ยง
              </div>

              <div className="text-[11px] text-slate-500 mt-1">
                ค้นหาผู้รับฝากและจัดการสัตว์เลี้ยง
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setRole('SITTER')
              }
              className={`rounded-2xl border p-4 text-left transition ${
                role === 'SITTER'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                  : 'border-purple-100 bg-[#FAF8FE] hover:border-purple-300'
              }`}
            >
              <Home className="w-5 h-5 text-purple-600 mb-2" />

              <div className="text-sm font-bold text-purple-950">
                ผู้รับฝากสัตว์เลี้ยง
              </div>

              <div className="text-[11px] text-slate-500 mt-1">
                สมัครเป็นผู้ให้บริการรับฝากสัตว์เลี้ยง
              </div>
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="ชื่อ"
                value={firstName}
                onChange={setFirstName}
                placeholder="ชื่อ"
              />

              <InputField
                label="นามสกุล"
                value={lastName}
                onChange={setLastName}
                placeholder="นามสกุล"
              />
            </div>

            <InputField
              label="ชื่อที่แสดง"
              value={displayName}
              onChange={setDisplayName}
              placeholder="เช่น ใบหม่อน"
            />

            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1.5">
                เบอร์โทรศัพท์
              </label>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="08xxxxxxxx"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] pl-11 pr-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

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
                  className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] pl-11 pr-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordField
                label="รหัสผ่าน"
                value={password}
                onChange={setPassword}
                show={showPassword}
                toggle={() =>
                  setShowPassword((prev) => !prev)
                }
              />

              <PasswordField
                label="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                toggle={() =>
                  setShowConfirmPassword(
                    (prev) => !prev
                  )
                }
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                {successMessage}
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
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                <>
                  สมัครสมาชิก
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-purple-950 mb-1.5">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required
        placeholder={placeholder}
        className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-purple-950 mb-1.5">
        {label}
      </label>

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />

        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          required
          className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] pl-11 pr-12 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600"
        >
          {show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}