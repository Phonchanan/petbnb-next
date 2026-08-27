'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

export default function SitterConsentPage() {
  const router = useRouter();

  const [accepted, setAccepted] =
    useState(false);

  const [alreadyAccepted, setAlreadyAccepted] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadConsent = async () => {
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
         * หา sitter_profiles
         * account ใหม่อาจยังไม่มี
         */
        const {
          data: sitterProfile,
          error: sitterProfileError,
        } = await supabase
          .from('sitter_profiles')
          .select('id')
          .eq(
            'user_id',
            current.id
          )
          .maybeSingle();

        if (sitterProfileError) {
          throw new Error(
            sitterProfileError.message
          );
        }

        /*
         * ถ้ายังไม่มี sitter_profiles
         * ยังไม่ต้องสร้างตอนโหลดหน้า
         */
        if (!sitterProfile) {
          return;
        }

        /*
         * ตรวจ Consent เดิม
         */
        const {
          data: verification,
          error: verificationError,
        } = await supabase
          .from('sitter_verifications')
          .select(`
            id,
            consent_accepted,
            consent_accepted_at,
            consent_version
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

        if (
          verification?.consent_accepted
        ) {
          setAccepted(true);
          setAlreadyAccepted(true);
        }
      } catch (err) {
        console.error(
          'LOAD CONSENT ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดข้อมูลการยินยอมได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadConsent();
  }, [router]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!accepted) {
      setError(
        'กรุณายอมรับเงื่อนไขการเก็บและใช้ข้อมูลส่วนบุคคลก่อนดำเนินการต่อ'
      );
      return;
    }

    try {
      setSaving(true);
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
        throw new Error(
          'บัญชีนี้ไม่ใช่บัญชี Sitter'
        );
      }

      /*
       * 1) หา sitter_profiles ก่อน
       */
      const {
        data: existingSitter,
        error: existingSitterError,
      } = await supabase
        .from('sitter_profiles')
        .select('id')
        .eq(
          'user_id',
          current.id
        )
        .maybeSingle();

      if (existingSitterError) {
        throw new Error(
          existingSitterError.message
        );
      }

      let sitterProfileId =
        existingSitter?.id ?? null;

      /*
       * 2) ถ้ายังไม่มี sitter_profiles
       * ให้สร้างแถวเริ่มต้น
       */
      if (!sitterProfileId) {
        const {
          data: newSitter,
          error: createSitterError,
        } = await supabase
          .from('sitter_profiles')
          .insert({
            user_id:
              current.id,

            /*
             * location_id ไม่ส่ง
             * เพราะเลือกทีหลังในหน้า profile
             */

            house_type:
              null,

            specialty:
              null,

            experience_years:
              0,

            starting_price:
              0,

            is_verified:
              false,

            is_available:
              false,

            /*
             * สำคัญ:
             * sitter_profiles รับได้แค่
             * PENDING / APPROVED / REJECTED
             */
            verification_status:
              'PENDING',
          })
          .select('id')
          .single();

        if (createSitterError) {
          console.error(
            'CREATE SITTER PROFILE ERROR:',
            createSitterError
          );

          throw new Error(
            createSitterError.message
          );
        }

        sitterProfileId =
          newSitter.id;
      }

      /*
       * 3) หา sitter_verifications
       */
      const {
        data: existingVerification,
        error: existingVerificationError,
      } = await supabase
        .from('sitter_verifications')
        .select(`
          id,
          consent_accepted
        `)
        .eq(
          'sitter_id',
          sitterProfileId
        )
        .maybeSingle();

      if (existingVerificationError) {
        throw new Error(
          existingVerificationError.message
        );
      }

      const now =
        new Date().toISOString();

      /*
       * 4) ถ้ามี verification อยู่แล้ว
       * ให้อัปเดต consent
       */
      if (existingVerification) {
        const {
          error: updateVerificationError,
        } = await supabase
          .from('sitter_verifications')
          .update({
            consent_accepted:
              true,

            consent_accepted_at:
              now,

            consent_version:
              'PDPA-SITTER-V1',

            updated_at:
              now,
          })
          .eq(
            'id',
            existingVerification.id
          );

        if (
          updateVerificationError
        ) {
          throw new Error(
            updateVerificationError.message
          );
        }
      } else {
        /*
         * 5) ถ้ายังไม่มี verification
         * ให้สร้างใหม่
         */
        const {
          error: insertVerificationError,
        } = await supabase
          .from('sitter_verifications')
          .insert({
            sitter_id:
              sitterProfileId,

            /*
             * sitter_verifications
             * ใช้ DRAFT ได้
             */
            verification_status:
              'DRAFT',

            consent_accepted:
              true,

            consent_accepted_at:
              now,

            consent_version:
              'PDPA-SITTER-V1',

            updated_at:
              now,
          });

        if (
          insertVerificationError
        ) {
          console.error(
            'CREATE VERIFICATION ERROR:',
            insertVerificationError
          );

          throw new Error(
            insertVerificationError.message
          );
        }
      }

      setAlreadyAccepted(true);

      /*
       * 6) ไปหน้าอัปโหลดเอกสาร
       */
      router.push(
        '/sitter/onboarding/verification'
      );
    } catch (err) {
      console.error(
        'SAVE CONSENT ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถบันทึกการยินยอมได้'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </main>
    );
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
              ขั้นตอนที่ 1
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              ยืนยันข้อมูลเพื่อสมัครเป็น Sitter
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              ก่อนเริ่มขั้นตอนยืนยันตัวตน
              กรุณาอ่านรายละเอียดการเก็บและใช้ข้อมูลส่วนบุคคล
              และยืนยันความยินยอม
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* PDPA */}
      <section className="mt-6 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-black text-purple-950">
          การเก็บและใช้ข้อมูลส่วนบุคคล
        </h2>

        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
          <p>
            PetBnB จะเก็บข้อมูลส่วนบุคคลที่จำเป็นสำหรับการสมัครเป็นผู้รับฝากสัตว์เลี้ยง
            เช่น ชื่อ นามสกุล ข้อมูลบัญชีผู้ใช้
            และข้อมูลสำหรับการยืนยันตัวตน
          </p>

          <p>
            ในขั้นตอนถัดไป
            ผู้สมัครจะต้องส่งรูปบัตรประชาชน
            และรูปถ่ายหน้าตรง
            เพื่อใช้ประกอบการตรวจสอบใบสมัคร
          </p>

          <p>
            ข้อมูลดังกล่าวใช้เพื่อวัตถุประสงค์ในการตรวจสอบ
            คัดกรอง และพิจารณาสิทธิ์การเป็น Sitter ของ PetBnB
            และจะไม่แสดงต่อผู้ใช้งานทั่วไป
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
          <p className="text-xs leading-5 text-purple-800">
            หลังจากยืนยันความยินยอม
            ระบบจะพาคุณไปยังขั้นตอนแนบหลักฐานยืนยันตัวตน
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-6"
        >
          <label
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              alreadyAccepted
                ? 'border-emerald-200 bg-emerald-50'
                : 'cursor-pointer border-purple-100 bg-[#FAF8FE]'
            }`}
          >
            <input
              type="checkbox"
              checked={
                accepted
              }
              disabled={
                alreadyAccepted
              }
              onChange={(
                event
              ) =>
                setAccepted(
                  event.target.checked
                )
              }
              className="mt-0.5 h-4 w-4 accent-purple-600"
            />

            <div className="flex-1">
              <div className="text-sm font-bold text-purple-950">
                ฉันได้อ่านและยินยอมให้ PetBnB เก็บและใช้ข้อมูลส่วนบุคคลเพื่อดำเนินการสมัครเป็น Sitter
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                รวมถึงข้อมูลและรูปภาพที่ใช้สำหรับการตรวจสอบยืนยันตัวตน
              </p>
            </div>

            {alreadyAccepted && (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            )}
          </label>

          {alreadyAccepted && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />

              คุณได้ยอมรับข้อตกลงนี้แล้ว
            </div>
          )}

          <button
            type="submit"
            disabled={
              saving ||
              !accepted
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                ยืนยันและดำเนินการต่อ
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}