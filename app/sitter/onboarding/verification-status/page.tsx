'use client';

import {
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import {
  useEffect,
  useState,
} from 'react';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

interface VerificationData {
  id: string;
  sitter_id: string;

  verification_status:
    VerificationStatus;

  identity_document_url:
    string | null;

  selfie_url:
    string | null;

  admin_note:
    string | null;

  verified_at:
    string | null;

  updated_at:
    string;
}

export default function VerificationStatusPage() {
  const router = useRouter();

  const [verification, setVerification] =
    useState<VerificationData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setLoading(true);
        setError('');

        /*
         * 1. ตรวจ Login
         */
        const current =
          await AuthService.getCurrentProfile();

        if (!current) {
          router.replace('/login');
          return;
        }

        /*
         * 2. ต้องเป็น SITTER
         */
        if (
          current.role.toUpperCase() !==
          'SITTER'
        ) {
          if (
            current.role.toUpperCase() ===
            'OWNER'
          ) {
            router.replace('/owner');
          } else {
            router.replace('/admin');
          }

          return;
        }

        /*
         * 3. หา sitter profile
         */
        const {
          data: sitterProfile,
          error: sitterError,
        } = await supabase
          .from('sitter_profiles')
          .select('id')
          .eq(
            'user_id',
            current.id
          )
          .maybeSingle();

        if (sitterError) {
          throw new Error(
            sitterError.message
          );
        }

        if (!sitterProfile) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        /*
         * 4. โหลด verification
         */
        const {
          data,
          error: verificationError,
        } = await supabase
          .from(
            'sitter_verifications'
          )
          .select(`
            id,
            sitter_id,
            verification_status,
            identity_document_url,
            selfie_url,
            admin_note,
            verified_at,
            updated_at
          `)
          .eq(
            'sitter_id',
            sitterProfile.id
          )
          .maybeSingle();

        if (verificationError) {
          throw new Error(
            verificationError.message
          );
        }

        /*
         * ยังไม่มีใบสมัคร
         */
        if (!data) {
          router.replace(
            '/sitter/onboarding/verification'
          );
          return;
        }

        /*
         * เอกสารยังไม่ครบ
         */
        if (
          !data.identity_document_url ||
          !data.selfie_url
        ) {
          router.replace(
            '/sitter/onboarding/verification'
          );
          return;
        }

        setVerification(
          data as VerificationData
        );
      } catch (err) {
        console.error(
          'LOAD VERIFICATION STATUS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดสถานะการสมัครได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังตรวจสอบสถานะการสมัคร...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      </main>
    );
  }

  if (!verification) {
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* HEADER */}
      <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              สถานะการสมัคร Sitter
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              ตรวจสอบสถานะการสมัคร
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              ตรวจสอบสถานะการพิจารณาใบสมัครเป็นผู้รับฝากสัตว์เลี้ยง
            </p>
          </div>
        </div>
      </section>

      {/* STATUS */}
      <section className="mt-6 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        {verification.verification_status ===
          'PENDING_APPROVAL' && (
          <PendingApprovalState
            updatedAt={
              verification.updated_at
            }
          />
        )}

        {verification.verification_status ===
          'APPROVED' && (
          <ApprovedState
            verifiedAt={
              verification.verified_at
            }
            onContinue={() =>
              router.push(
                '/sitter/profile'
              )
            }
          />
        )}

        {verification.verification_status ===
          'REJECTED' && (
          <RejectedState
            note={
              verification.admin_note
            }
            onRetry={() =>
              router.push(
                '/sitter/onboarding/verification'
              )
            }
          />
        )}

        {(
          verification.verification_status ===
            'SUBMITTED' ||
          verification.verification_status ===
            'PENDING' ||
          verification.verification_status ===
            'DRAFT'
        ) && (
          <IncompleteState
            status={
              verification.verification_status
            }
            onContinue={() =>
              router.push(
                '/sitter/onboarding/core-quiz'
              )
            }
          />
        )}
      </section>
    </main>
  );
}

/*
 * รอ Admin อนุมัติ
 */
function PendingApprovalState({
  updatedAt,
}: {
  updatedAt: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-amber-100 text-amber-600">
        <Clock3 className="h-9 w-9" />
      </div>

      <h2 className="mt-5 text-xl font-black text-purple-950">
        รอการอนุมัติจากผู้ดูแลระบบ
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        คุณส่งข้อมูลการสมัครและผ่านแบบทดสอบตามขั้นตอนแล้ว
        ขณะนี้ใบสมัครอยู่ระหว่างการตรวจสอบจากผู้ดูแลระบบ
      </p>

      <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-100 bg-amber-50 p-5 text-left">
        <div className="text-xs font-black text-amber-800">
          ข้อมูลที่ผู้ดูแลระบบจะตรวจสอบ
        </div>

        <div className="mt-3 space-y-2">
          <StatusLine text="ข้อมูลบัญชีผู้สมัคร" />

          <StatusLine text="รูปบัตรประชาชน" />

          <StatusLine text="รูปถ่ายหน้าตรง" />

          <StatusLine text="ผลแบบทดสอบพื้นฐานการเป็นพี่เลี้ยงสัตว์" />

          <StatusLine text="ผลแบบทดสอบประเภทสัตว์ที่เลือก" />
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs leading-5 text-slate-600">
          ในระหว่างรอการอนุมัติ
          คุณยังไม่สามารถเปิดสถานะ
          <strong>
            {' '}พร้อมรับงาน
          </strong>{' '}
          ได้
        </p>
      </div>

      <p className="mt-4 text-[10px] text-slate-400">
        อัปเดตล่าสุด{' '}
        {formatDateTime(
          updatedAt
        )}
      </p>
    </div>
  );
}

/*
 * Admin อนุมัติแล้ว
 */
function ApprovedState({
  verifiedAt,
  onContinue,
}: {
  verifiedAt: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <h2 className="mt-5 text-xl font-black text-purple-950">
        ใบสมัครได้รับการอนุมัติแล้ว 🎉
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        คุณได้รับการอนุมัติให้เป็นผู้รับฝากสัตว์เลี้ยงของ PetBnB แล้ว
        ขั้นตอนต่อไปคือกรอกข้อมูลโปรไฟล์ผู้รับฝาก
        และเปิดสถานะรับงาน
      </p>

      {verifiedAt && (
        <p className="mt-3 text-[11px] text-slate-400">
          อนุมัติเมื่อ{' '}
          {formatDateTime(
            verifiedAt
          )}
        </p>
      )}

      <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="text-xs font-bold text-emerald-700">
          คุณสามารถใช้งานฟังก์ชันผู้รับฝากได้แล้ว
        </div>

        <p className="mt-1 text-xs leading-5 text-emerald-700/80">
          กรอกข้อมูลพื้นที่ ที่พัก
          ประสบการณ์ ราคา
          และเปิดสถานะพร้อมรับงานจากหน้าโปรไฟล์
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
      >
        ไปกรอกโปรไฟล์ผู้รับฝาก
      </button>
    </div>
  );
}

/*
 * Admin ปฏิเสธ
 */
function RejectedState({
  note,
  onRetry,
}: {
  note: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-rose-100 text-rose-600">
        <XCircle className="h-9 w-9" />
      </div>

      <h2 className="mt-5 text-xl font-black text-purple-950">
        ใบสมัครยังไม่ได้รับการอนุมัติ
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        กรุณาตรวจสอบเหตุผลจากผู้ดูแลระบบ
        และแก้ไขข้อมูลหรือส่งเอกสารใหม่ตามที่ระบุ
      </p>

      <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left">
        <div className="text-xs font-bold text-rose-700">
          เหตุผลจากผู้ดูแลระบบ
        </div>

        <p className="mt-2 text-xs leading-5 text-rose-600">
          {note ||
            'ผู้ดูแลระบบไม่ได้ระบุรายละเอียดเพิ่มเติม'}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-purple-700"
      >
        แก้ไขและส่งข้อมูลใหม่
      </button>
    </div>
  );
}

/*
 * ส่งเอกสารแล้วแต่ยังทำ Quiz ไม่ครบ
 */
function IncompleteState({
  status,
  onContinue,
}: {
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PENDING';

  onContinue: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-purple-100 text-purple-600">
        <ShieldCheck className="h-9 w-9" />
      </div>

      <h2 className="mt-5 text-xl font-black text-purple-950">
        ดำเนินการสมัครต่อ
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        คุณส่งข้อมูลยืนยันตัวตนแล้ว
        แต่ยังต้องผ่านแบบทดสอบพื้นฐาน
        และแบบทดสอบประเภทสัตว์ก่อนส่งใบสมัครให้ผู้ดูแลระบบพิจารณา
      </p>

      <div className="mx-auto mt-5 max-w-lg rounded-2xl bg-purple-50 p-4">
        <p className="text-xs text-purple-700">
          สถานะปัจจุบัน:{' '}
          <strong>
            {status}
          </strong>
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 rounded-2xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white"
      >
        ไปทำแบบทดสอบพื้นฐาน
      </button>
    </div>
  );
}

function StatusLine({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-amber-800">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />

      <span>
        {text}
      </span>
    </div>
  );
}

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'th-TH',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}