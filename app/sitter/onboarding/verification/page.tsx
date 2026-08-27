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
  FileImage,
  Loader2,
  ShieldCheck,
  Upload,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

interface VerificationRow {
  id: string;
  sitter_id: string;
  verification_status: VerificationStatus;
  identity_document_url: string | null;
  selfie_url: string | null;
  consent_accepted: boolean;
  consent_accepted_at: string | null;
}

export default function SitterVerificationPage() {
  const router = useRouter();

  const [sitterProfileId, setSitterProfileId] =
    useState('');

  const [verificationId, setVerificationId] =
    useState('');

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('DRAFT');

  const [identityFile, setIdentityFile] =
    useState<File | null>(null);

  const [selfieFile, setSelfieFile] =
    useState<File | null>(null);

  const [identityPreview, setIdentityPreview] =
    useState<string | null>(null);

  const [selfiePreview, setSelfiePreview] =
    useState<string | null>(null);

  const [existingIdentityPath, setExistingIdentityPath] =
    useState<string | null>(null);

  const [existingSelfiePath, setExistingSelfiePath] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
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

        /*
         * ถ้ายังไม่มี Sitter Profile
         * ให้กลับไป Consent
         */
        if (!sitterProfile) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        setSitterProfileId(
          sitterProfile.id
        );

        /*
         * โหลด sitter_verifications
         */
        const {
          data: verification,
          error: verificationError,
        } = await supabase
          .from('sitter_verifications')
          .select(`
            id,
            sitter_id,
            verification_status,
            identity_document_url,
            selfie_url,
            consent_accepted,
            consent_accepted_at
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
         * ต้องมี verification จากหน้า Consent ก่อน
         */
        if (!verification) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        const row =
          verification as VerificationRow;

        /*
         * ต้องยอมรับ PDPA ก่อน
         */
        if (!row.consent_accepted) {
          router.replace(
            '/sitter/onboarding/consent'
          );
          return;
        }

        /*
         * ถ้า Admin APPROVED แล้ว
         * ไม่ควรกลับมาแก้เอกสารจาก flow สมัครปกติ
         */
        if (
          row.verification_status ===
          'APPROVED'
        ) {
          router.replace(
            '/sitter/onboarding/verification-status'
          );
          return;
        }

        setVerificationId(
          row.id
        );

        setVerificationStatus(
          row.verification_status
        );

        setExistingIdentityPath(
          row.identity_document_url
        );

        setExistingSelfiePath(
          row.selfie_url
        );
      } catch (err) {
        console.error(
          'LOAD VERIFICATION ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดข้อมูลยืนยันตัวตนได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  /*
   * Cleanup preview URL
   */
  useEffect(() => {
    return () => {
      if (
        identityPreview?.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          identityPreview
        );
      }

      if (
        selfiePreview?.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          selfiePreview
        );
      }
    };
  }, [
    identityPreview,
    selfiePreview,
  ]);

  const validateFile = (
    file: File
  ) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      throw new Error(
        'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP'
      );
    }

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      throw new Error(
        'รูปต้องมีขนาดไม่เกิน 5 MB'
      );
    }
  };

  const handleIdentityChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      validateFile(file);

      if (
        identityPreview?.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          identityPreview
        );
      }

      setIdentityFile(file);

      setIdentityPreview(
        URL.createObjectURL(file)
      );

      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ไฟล์ไม่ถูกต้อง'
      );

      event.target.value = '';
    }
  };

  const handleSelfieChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      validateFile(file);

      if (
        selfiePreview?.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          selfiePreview
        );
      }

      setSelfieFile(file);

      setSelfiePreview(
        URL.createObjectURL(file)
      );

      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ไฟล์ไม่ถูกต้อง'
      );

      event.target.value = '';
    }
  };

  /*
   * Upload เข้า Private Bucket
   *
   * เก็บ path เช่น:
   * userId/identity-xxxx.jpg
   * userId/selfie-xxxx.jpg
   */
  const uploadPrivateImage = async (
    userId: string,
    file: File,
    prefix: 'identity' | 'selfie'
  ): Promise<string> => {
    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg';

    const filePath =
      `${userId}/${prefix}-${crypto.randomUUID()}.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        'sitter-verifications'
      )
      .upload(
        filePath,
        file,
        {
          upsert: false,
          cacheControl: '3600',
          contentType:
            file.type,
        }
      );

    if (uploadError) {
      console.error(
        'UPLOAD VERIFICATION IMAGE ERROR:',
        uploadError
      );

      throw new Error(
        `ไม่สามารถอัปโหลดรูปได้: ${uploadError.message}`
      );
    }

    /*
     * Private bucket:
     * ไม่ใช้ getPublicUrl()
     * เก็บเฉพาะ path ใน database
     */
    return filePath;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !sitterProfileId ||
      !verificationId
    ) {
      setError(
        'ไม่พบข้อมูลใบสมัคร Sitter'
      );
      return;
    }

    /*
     * ต้องมีรูปบัตร
     * ไม่ว่าจะเป็นรูปเดิมหรือรูปใหม่
     */
    if (
      !identityFile &&
      !existingIdentityPath
    ) {
      setError(
        'กรุณาอัปโหลดรูปบัตรประชาชน'
      );
      return;
    }

    /*
     * ต้องมีรูปหน้าตรง
     */
    if (
      !selfieFile &&
      !existingSelfiePath
    ) {
      setError(
        'กรุณาอัปโหลดรูปถ่ายหน้าตรง'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.user
      ) {
        throw new Error(
          'กรุณาเข้าสู่ระบบใหม่'
        );
      }

      let identityPath =
        existingIdentityPath;

      let selfiePath =
        existingSelfiePath;

      /*
       * Upload รูปใหม่ถ้ามี
       */
      if (identityFile) {
        identityPath =
          await uploadPrivateImage(
            session.user.id,
            identityFile,
            'identity'
          );
      }

      if (selfieFile) {
        selfiePath =
          await uploadPrivateImage(
            session.user.id,
            selfieFile,
            'selfie'
          );
      }

      if (
        !identityPath ||
        !selfiePath
      ) {
        throw new Error(
          'ข้อมูลรูปยืนยันตัวตนไม่ครบ'
        );
      }

      const now =
        new Date().toISOString();

      /*
       * บันทึกลง sitter_verifications
       *
       * จุดสำคัญ:
       * หลังแนบเอกสารครบ = SUBMITTED
       *
       * ยังไม่ใช่ PENDING_APPROVAL
       * เพราะต้องผ่าน Quiz ก่อน
       */
      const {
        error: updateError,
      } = await supabase
        .from('sitter_verifications')
        .update({
          identity_document_url:
            identityPath,

          selfie_url:
            selfiePath,

          verification_status:
            'SUBMITTED',

          /*
           * ถ้าเคย REJECTED
           * แล้วส่งเอกสารใหม่
           * ให้ล้างข้อมูล Admin เก่า
           */
          admin_note:
            null,

          verified_by:
            null,

          verified_at:
            null,

          updated_at:
            now,
        })
        .eq(
          'id',
          verificationId
        )
        .eq(
          'sitter_id',
          sitterProfileId
        );

      if (updateError) {
        console.error(
          'UPDATE VERIFICATION ERROR:',
          updateError
        );

        throw new Error(
          updateError.message
        );
      }

      /*
       * sitter_profiles ยังเป็น PENDING
       *
       * ตารางนี้รับได้แค่
       * PENDING / APPROVED / REJECTED
       */
      const {
        error: sitterProfileError,
      } = await supabase
        .from('sitter_profiles')
        .update({
          verification_status:
            'PENDING',

          is_verified:
            false,

          is_available:
            false,

          updated_at:
            now,
        })
        .eq(
          'id',
          sitterProfileId
        );

      if (
        sitterProfileError
      ) {
        console.error(
          'UPDATE SITTER PROFILE STATUS ERROR:',
          sitterProfileError
        );

        throw new Error(
          sitterProfileError.message
        );
      }

      setVerificationStatus(
        'SUBMITTED'
      );

      setExistingIdentityPath(
        identityPath
      );

      setExistingSelfiePath(
        selfiePath
      );

      setIdentityFile(null);
      setSelfieFile(null);

      setMessage(
        'ส่งข้อมูลยืนยันตัวตนเรียบร้อยแล้ว'
      );

      /*
       * ขั้นตอนต่อไป = Core Quiz
       */
      router.push(
        '/sitter/onboarding/core-quiz'
      );
    } catch (err) {
      console.error(
        'SUBMIT VERIFICATION ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถส่งข้อมูลยืนยันตัวตนได้'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex min-h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs text-slate-400">
            กำลังโหลดข้อมูลยืนยันตัวตน...
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
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              ขั้นตอนที่ 2
            </div>

            <h1 className="mt-3 text-2xl font-black text-[#2E1065]">
              ยืนยันตัวตน
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              แนบหลักฐานสำหรับการสมัครเป็นผู้รับฝากสัตว์เลี้ยง
              หลังจากส่งข้อมูลแล้ว
              คุณจะเข้าสู่แบบทดสอบพื้นฐานการเป็นพี่เลี้ยงสัตว์
            </p>
          </div>
        </div>
      </section>

      {/* STATUS */}
      {verificationStatus ===
        'SUBMITTED' && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>
            <div className="text-xs font-bold text-emerald-800">
              ส่งข้อมูลยืนยันตัวตนแล้ว
            </div>

            <p className="mt-1 text-xs leading-5 text-emerald-700">
              คุณสามารถดำเนินการทำแบบทดสอบพื้นฐานต่อได้
            </p>
          </div>
        </div>
      )}

      {verificationStatus ===
        'REJECTED' && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-bold text-rose-700">
            ข้อมูลเดิมไม่ได้รับการอนุมัติ
          </p>

          <p className="mt-1 text-xs leading-5 text-rose-600">
            กรุณาอัปโหลดรูปที่ถูกต้องและชัดเจนใหม่อีกครั้ง
          </p>
        </div>
      )}

      {message && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />

          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6"
      >
        {/* ID CARD */}
        <UploadCard
          title="รูปบัตรประชาชน"
          description="อัปโหลดรูปบัตรประชาชนที่เห็นข้อมูลบนบัตรได้ชัดเจน"
          preview={
            identityPreview
          }
          existing={
            Boolean(
              existingIdentityPath
            )
          }
          inputId="identity-document"
          onChange={
            handleIdentityChange
          }
        />

        {/* FRONT-FACING PHOTO */}
        <UploadCard
          title="รูปถ่ายหน้าตรง"
          description="อัปโหลดรูปถ่ายหน้าตรงของผู้สมัคร เห็นใบหน้าชัดเจน ไม่สวมหน้ากากหรือแว่นดำ"
          preview={
            selfiePreview
          }
          existing={
            Boolean(
              existingSelfiePath
            )
          }
          inputId="selfie-document"
          onChange={
            handleSelfieChange
          }
        />

        {/* PRIVACY */}
        <section className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

            <div>
              <div className="text-xs font-bold text-purple-950">
                การจัดเก็บข้อมูล
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                รูปที่ใช้ยืนยันตัวตนจะถูกจัดเก็บในพื้นที่ส่วนตัวของระบบ
                และไม่แสดงต่อผู้ใช้งานทั่วไป
                ผู้ดูแลระบบจะใช้ข้อมูลนี้เพื่อประกอบการตรวจสอบใบสมัคร Sitter
              </p>
            </div>
          </div>
        </section>

        {/* NEXT INFO */}
        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="text-xs font-bold text-amber-800">
            ขั้นตอนถัดไป
          </div>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            เมื่อส่งหลักฐานเรียบร้อยแล้ว
            ระบบจะพาคุณไปทำแบบทดสอบพื้นฐานการเป็นพี่เลี้ยงสัตว์
            ซึ่งต้องได้คะแนนอย่างน้อย 80%
          </p>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังส่งข้อมูล...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              ส่งข้อมูลและทำแบบทดสอบต่อ
            </>
          )}
        </button>
      </form>
    </main>
  );
}

function UploadCard({
  title,
  description,
  preview,
  existing,
  inputId,
  onChange,
}: {
  title: string;
  description: string;
  preview: string | null;
  existing: boolean;
  inputId: string;

  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <section className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
          <FileImage className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-sm font-black text-purple-950">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {preview ? (
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-slate-50">
            <img
              src={preview}
              alt={title}
              className="max-h-80 w-full object-contain"
            />
          </div>
        ) : existing ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />

            <p className="mt-3 text-xs font-bold text-emerald-700">
              มีรูปอยู่ในระบบแล้ว
            </p>

            <p className="mt-1 text-[10px] text-emerald-600">
              เลือกรูปใหม่หากต้องการเปลี่ยน
            </p>
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-[#FAF8FE] p-6">
            <Camera className="h-9 w-9 text-purple-300" />

            <p className="mt-3 text-xs text-slate-400">
              ยังไม่ได้เลือกรูป
            </p>
          </div>
        )}
      </div>

      <label
        htmlFor={inputId}
        className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 py-3 text-xs font-bold text-purple-700 transition hover:bg-purple-100"
      >
        <Upload className="h-4 w-4" />

        {preview ||
        existing
          ? 'เปลี่ยนรูป'
          : 'เลือกรูป'}
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        className="hidden"
      />

      <p className="mt-2 text-center text-[10px] text-slate-400">
        JPG, PNG หรือ WEBP • ขนาดไม่เกิน 5 MB
      </p>
    </section>
  );
}