/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import {
  type CertifiedCategory,
  type SitterServiceItem,
  SitterService,
} from '@/lib/supabase/sitterService';

import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * FORM
 * ======================================================= */

interface ServiceForm {
  categoryId: string;
  serviceName: string;
  description: string;
  price: string;
  priceUnit: string;
  isActive: boolean;
}

const initialForm: ServiceForm = {
  categoryId: '',
  serviceName: '',
  description: '',
  price: '',
  priceUnit: 'DAY',
  isActive: true,
};

/* =========================================================
 * PAGE
 * ======================================================= */

export default function SitterServicesPage() {
  const [
    sitterId,
    setSitterId,
  ] = useState('');

  const [
    categories,
    setCategories,
  ] = useState<
    CertifiedCategory[]
  >([]);

  const [
    services,
    setServices,
  ] = useState<
    SitterServiceItem[]
  >([]);

  const [
    form,
    setForm,
  ] = useState<ServiceForm>(
    initialForm
  );

  const [
    editingServiceId,
    setEditingServiceId,
  ] = useState<
    string | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [
    togglingId,
    setTogglingId,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  /* =======================================================
   * TOAST
   * ===================================================== */

  const toastTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const clearToastTimer =
    useCallback(() => {
      if (
        toastTimerRef.current
      ) {
        clearTimeout(
          toastTimerRef.current
        );

        toastTimerRef.current =
          null;
      }
    }, []);

  const showSuccess =
    useCallback(
      (
        text: string
      ) => {
        clearToastTimer();

        setError('');
        setMessage(text);

        toastTimerRef.current =
          setTimeout(() => {
            setMessage('');

            toastTimerRef.current =
              null;
          }, 3500);
      },
      [clearToastTimer]
    );

  const showError =
    useCallback(
      (
        text: string
      ) => {
        clearToastTimer();

        setMessage('');
        setError(text);

        toastTimerRef.current =
          setTimeout(() => {
            setError('');

            toastTimerRef.current =
              null;
          }, 5000);
      },
      [clearToastTimer]
    );

  useEffect(() => {
    return () => {
      clearToastTimer();
    };
  }, [clearToastTimer]);

  /* =======================================================
   * LOAD
   * ===================================================== */

  const loadPage =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');

          const id =
            await SitterService.getCurrentSitterId();

          setSitterId(id);

          const [
            certifiedCategories,
            serviceItems,
          ] =
            await Promise.all([
              SitterService.getCertifiedCategories(
                id
              ),

              SitterService.getServices(
                id
              ),
            ]);

          setCategories(
            certifiedCategories
          );

          setServices(
            serviceItems
          );
        } catch (err) {
          console.error(
            'LOAD SITTER SERVICES PAGE ERROR:',
            err
          );

          showError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูลบริการได้'
          );
        } finally {
          setLoading(false);
        }
      },
      [showError]
    );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  /* =======================================================
   * CATEGORY MAP
   * ===================================================== */

  const categoryMap =
    useMemo(() => {
      return new Map(
        categories.map(
          (category) => [
            category.categoryId,
            category,
          ]
        )
      );
    }, [categories]);

  /* =======================================================
   * FORM HELPERS
   * ===================================================== */

  const setField = <
    K extends keyof ServiceForm,
  >(
    key: K,
    value: ServiceForm[K]
  ) => {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  };

  const resetForm =
    () => {
      setForm(
        initialForm
      );

      setEditingServiceId(
        null
      );
    };

  /* =======================================================
   * EDIT
   * ===================================================== */

  const handleEdit = (
    service: SitterServiceItem
  ) => {
    setEditingServiceId(
      service.id
    );

    setForm({
      categoryId:
        service.categoryId,

      serviceName:
        service.serviceName,

      description:
        service.description ??
        '',

      price:
        String(
          service.price
        ),

      priceUnit:
        service.priceUnit,

      isActive:
        service.isActive,
    });

    clearToastTimer();

    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =======================================================
   * SAVE
   * ===================================================== */

  const handleSave =
    async () => {
      if (!sitterId) {
        showError(
          'ไม่พบข้อมูล Sitter'
        );

        return;
      }

      if (
        !form.categoryId
      ) {
        showError(
          'กรุณาเลือกประเภทสัตว์'
        );

        return;
      }

      if (
        !form.serviceName.trim()
      ) {
        showError(
          'กรุณาระบุชื่อบริการ'
        );

        return;
      }

      const price =
        Number(
          form.price
        );

      if (
        !Number.isFinite(
          price
        ) ||
        price <= 0
      ) {
        showError(
          'กรุณาระบุราคาที่ถูกต้อง'
        );

        return;
      }

      if (
        !categoryMap.has(
          form.categoryId
        )
      ) {
        showError(
          'คุณยังไม่ผ่านการรับรองสำหรับประเภทสัตว์นี้'
        );

        return;
      }

      try {
        setSaving(true);

        clearToastTimer();

        setError('');
        setMessage('');

        /* =========================
         * UPDATE
         * ======================= */

        if (
          editingServiceId
        ) {
          const updated =
            await SitterService.updateService({
              id:
                editingServiceId,

              sitterId,

              categoryId:
                form.categoryId,

              serviceName:
                form.serviceName,

              description:
                form.description,

              price,

              priceUnit:
                form.priceUnit,

              isActive:
                form.isActive,
            });

          setServices(
            (current) =>
              current.map(
                (service) =>
                  service.id ===
                  updated.id
                    ? updated
                    : service
              )
          );

          resetForm();

          showSuccess(
            'แก้ไขบริการเรียบร้อยแล้ว'
          );

          return;
        }

        /* =========================
         * CREATE
         * ======================= */

        const created =
          await SitterService.createService({
            sitterId,

            categoryId:
              form.categoryId,

            serviceName:
              form.serviceName,

            description:
              form.description,

            price,

            priceUnit:
              form.priceUnit,
          });

        setServices(
          (current) => [
            created,
            ...current,
          ]
        );

        resetForm();

        showSuccess(
          'เพิ่มบริการเรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'SAVE SERVICE ERROR:',
          err
        );

        showError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถบันทึกบริการได้'
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
   * DELETE
   * ===================================================== */

  const handleDelete =
    async (
      service: SitterServiceItem
    ) => {
      if (
        deletingId === service.id
      ) {
        return;
      }

      try {
        setDeletingId(
          service.id
        );

        clearToastTimer();

        setError('');
        setMessage('');

        /*
         * ลบบริการได้เมื่อไม่มีงานที่ยังค้างอยู่
         *
         * สถานะที่ถือว่ายังค้าง:
         * - PENDING      รอการตอบรับ
         * - CONFIRMED    ยืนยันแล้ว
         * - IN_PROGRESS  กำลังให้บริการ
         *
         * COMPLETED / REJECTED / CANCELLED
         * ไม่ถือว่าเป็นงานค้าง
         */
        const {
          data: activeBookings,
          error: bookingError,
        } = await supabase
          .from('bookings')
          .select(`
            id,
            status
          `)
          .eq(
            'service_id',
            service.id
          )
          .eq(
            'sitter_id',
            service.sitterId
          )
          .in(
            'status',
            [
              'PENDING',
              'CONFIRMED',
              'IN_PROGRESS',
            ]
          )
          .limit(1);

        if (bookingError) {
          throw new Error(
            bookingError.message ||
              'ไม่สามารถตรวจสอบรายการจองของบริการได้'
          );
        }

        if (
          activeBookings &&
          activeBookings.length > 0
        ) {
          showError(
            'ยังไม่สามารถลบบริการนี้ได้ เนื่องจากมีคำขอหรือรายการรับฝากที่ยังดำเนินการไม่เสร็จ'
          );

          return;
        }

        const confirmed =
          window.confirm(
            `ต้องการลบบริการ "${service.serviceName}" หรือไม่?`
          );

        if (!confirmed) {
          return;
        }

        await SitterService.deleteService(
          service.id,
          service.sitterId
        );

        setServices(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                service.id
            )
        );

        if (
          editingServiceId ===
          service.id
        ) {
          resetForm();
        }

        showSuccess(
          'ลบบริการเรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'DELETE SERVICE ERROR:',
          err
        );

        showError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถลบบริการได้'
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  /* =======================================================
   * TOGGLE ACTIVE
   * ===================================================== */

  const handleToggle =
    async (
      service: SitterServiceItem
    ) => {
      try {
        setTogglingId(
          service.id
        );

        clearToastTimer();

        setError('');
        setMessage('');

        const nextValue =
          !service.isActive;

        await SitterService.setActive(
          service,
          nextValue
        );

        setServices(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                service.id
                  ? {
                      ...item,
                      isActive:
                        nextValue,
                    }
                  : item
            )
        );

        showSuccess(
          nextValue
            ? 'เปิดบริการเรียบร้อยแล้ว'
            : 'ปิดบริการเรียบร้อยแล้ว'
        );
      } catch (err) {
        console.error(
          'TOGGLE SERVICE ERROR:',
          err
        );

        showError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถเปลี่ยนสถานะบริการได้'
        );
      } finally {
        setTogglingId(
          null
        );
      }
    };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <ToastNotification
          message={
            message
          }
          error={
            error
          }
          onCloseMessage={() => {
            clearToastTimer();
            setMessage('');
          }}
          onCloseError={() => {
            clearToastTimer();
            setError('');
          }}
        />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-600" />

            <p className="mt-3 text-sm text-slate-400">
              กำลังโหลดบริการ...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      {/* ===================================================
       * TOAST
       * ================================================= */}

      <ToastNotification
        message={
          message
        }
        error={
          error
        }
        onCloseMessage={() => {
          clearToastTimer();
          setMessage('');
        }}
        onCloseError={() => {
          clearToastTimer();
          setError('');
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        {/* =================================================
         * HEADER
         * =============================================== */}

        <section className="relative overflow-hidden rounded-[28px] border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50/60 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-purple-100/70 blur-3xl" />
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
            <BadgeCheck className="h-4 w-4" />

            Certified Services
          </div>

          <h1 className="mt-3 text-2xl font-black text-purple-950">
            บริการของฉัน
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            เพิ่มบริการได้เฉพาะประเภทสัตว์ที่คุณผ่านแบบทดสอบ
            และได้รับสถานะ CERTIFIED แล้วเท่านั้น
          </p>
        </section>

        {/* =================================================
         * CERTIFIED CATEGORIES
         * =============================================== */}

        <section className="mt-5 rounded-[26px] border border-purple-100 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="font-black text-purple-950">
              ประเภทสัตว์ที่ผ่านการรับรอง
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              ประเภทเหล่านี้อ้างอิงจากผลแบบทดสอบของคุณโดยตรง
            </p>
          </div>

          {categories.length ===
          0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-5 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-amber-500" />

              <p className="mt-2 text-sm font-bold text-amber-800">
                ยังไม่มีประเภทสัตว์ที่ผ่านการรับรอง
              </p>

              <p className="mt-1 text-xs text-amber-700">
                กรุณาทำแบบทดสอบประเภทสัตว์ให้ผ่านก่อนเพิ่มบริการ
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map(
                (
                  category
                ) => (
                  <div
                    key={
                      category.categoryId
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2.5"
                  >
                    <span className="text-lg">
                      {category.icon ||
                        '🐾'}
                    </span>

                    <div>
                      <p className="text-xs font-black text-emerald-800">
                        {
                          category.nameTh
                        }
                      </p>

                      <p className="mt-0.5 text-[9px] font-bold text-emerald-600">
                        CERTIFIED
                      </p>
                    </div>

                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
         * MAIN CONTENT - TWO COLUMNS
         * =============================================== */}

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* LEFT: FORM */}
          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-purple-950">
                {editingServiceId
                  ? 'แก้ไขบริการ'
                  : 'เพิ่มบริการ'}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                กำหนดบริการและราคาในประเภทสัตว์ที่ผ่านการรับรอง
              </p>
            </div>

            {editingServiceId && (
              <button
                type="button"
                onClick={
                  resetForm
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />

                ยกเลิก
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* CATEGORY */}

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                ประเภทสัตว์
              </label>

              <select
                value={
                  form.categoryId
                }
                disabled={
                  categories.length ===
                  0
                }
                onChange={(
                  event
                ) =>
                  setField(
                    'categoryId',
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  เลือกประเภทสัตว์ที่ผ่านการรับรอง
                </option>

                {categories.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category.categoryId
                      }
                      value={
                        category.categoryId
                      }
                    >
                      {
                        category.nameTh
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SERVICE NAME */}

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                ชื่อบริการ
              </label>

              <input
                value={
                  form.serviceName
                }
                onChange={(
                  event
                ) =>
                  setField(
                    'serviceName',
                    event.target.value
                  )
                }
                placeholder="เช่น รับฝากรายวัน"
                className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100"
              />
            </div>

            {/* PRICE */}

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                ราคา
              </label>

              <input
                type="number"
                min="1"
                value={
                  form.price
                }
                onChange={(
                  event
                ) =>
                  setField(
                    'price',
                    event.target.value
                  )
                }
                placeholder="เช่น 250"
                className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100"
              />
            </div>

            {/* PRICE UNIT */}

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                หน่วยราคา
              </label>

              <select
                value={
                  form.priceUnit
                }
                onChange={(
                  event
                ) =>
                  setField(
                    'priceUnit',
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100"
              >
                <option value="DAY">
                  บาท / วัน
                </option>

                <option value="NIGHT">
                  บาท / คืน
                </option>
              </select>
            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-600">
                รายละเอียดบริการ
              </label>

              <textarea
                rows={4}
                value={
                  form.description
                }
                onChange={(
                  event
                ) =>
                  setField(
                    'description',
                    event.target.value
                  )
                }
                placeholder="อธิบายรายละเอียดการดูแล..."
                className="w-full resize-none rounded-2xl border border-purple-100 bg-[#FCFAFF] px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={
              saving ||
              categories.length ===
                0
            }
            onClick={() =>
              void handleSave()
            }
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingServiceId ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {editingServiceId
              ? 'บันทึกการแก้ไข'
              : 'เพิ่มบริการ'}
          </button>
        </section>

          {/* RIGHT: SERVICES */}
          <section className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-black text-purple-950">
              บริการที่สร้างไว้
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Owner จะเห็นเฉพาะบริการที่เปิดใช้งาน
            </p>
          </div>

          {services.length ===
          0 ? (
            <div className="mt-4 rounded-[28px] border border-dashed border-purple-200 bg-white p-10 text-center">
              <Plus className="mx-auto h-7 w-7 text-purple-200" />

              <p className="mt-3 text-sm font-bold text-slate-600">
                ยังไม่มีบริการ
              </p>

              <p className="mt-1 text-xs text-slate-400">
                เพิ่มบริการแรกของคุณได้จากแบบฟอร์มด้านบน
              </p>
            </div>
          ) : (
            <div className="mt-4 grid items-stretch gap-3">
              {services.map(
                (
                  service
                ) => {
                  const category =
                    categoryMap.get(
                      service.categoryId
                    );

                  return (
                    <article
                      key={
                        service.id
                      }
                      className="flex h-full flex-col rounded-[22px] border border-purple-100 bg-gradient-to-br from-white to-purple-50/35 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
                    >
                      {/* SERVICE INFO */}

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="wrap-break-word font-black text-purple-950">
                              {
                                service.serviceName
                              }
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                                service.isActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {service.isActive
                                ? 'เปิดใช้งาน'
                                : 'ปิดใช้งาน'}
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-bold text-purple-600">
                            {category?.icon ||
                              '🐾'}{' '}
                            {category
                              ?.nameTh ||
                              service.categoryId}
                          </p>
                        </div>

                        {/* PRICE */}

                        <p className="shrink-0 text-lg font-black text-purple-700">
                          ฿
                          {service.price.toLocaleString(
                            'th-TH'
                          )}
                        </p>
                      </div>

                      {/* DESCRIPTION */}

                      {service.description ? (
                        <p className="mt-3 wrap-break-word text-xs leading-6 text-slate-500">
                          {
                            service.description
                          }
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-slate-300">
                          ไม่มีรายละเอียดเพิ่มเติม
                        </p>
                      )}

                      {/* PRICE UNIT */}

                      <p className="mt-2 text-[10px] text-slate-400">
                        {service.priceUnit ===
                        'NIGHT'
                          ? 'ราคาต่อคืน'
                          : 'ราคาต่อวัน'}
                      </p>

                      {/* =================================================
                       * BUTTONS
                       *
                       * mt-auto ทำให้ปุ่มของทุก card อยู่ด้านล่างเท่ากัน
                       * sm:grid-cols-3 ทำให้ปุ่มทั้ง 3 กว้างเท่ากัน
                       * =============================================== */}

                      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-3">
                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              service
                            )
                          }
                          className="
                            col-span-2
                            inline-flex
                            h-11
                            w-full
                            items-center
                            sm:col-span-1
                            justify-center
                            gap-2
                            rounded-xl
                            bg-purple-50
                            px-3
                            text-xs
                            font-bold
                            text-purple-700
                            transition
                            hover:bg-purple-100
                          "
                        >
                          <Pencil className="h-4 w-4 shrink-0" />

                          <span>
                            แก้ไข
                          </span>
                        </button>

                        {/* TOGGLE */}

                        <button
                          type="button"
                          disabled={
                            togglingId ===
                            service.id
                          }
                          onClick={() =>
                            void handleToggle(
                              service
                            )
                          }
                          className="
                            inline-flex
                            h-11
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-slate-100
                            px-3
                            text-xs
                            font-bold
                            text-slate-600
                            transition
                            hover:bg-slate-200
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {togglingId ===
                          service.id ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          ) : null}

                          <span className="whitespace-nowrap">
                            {service.isActive
                              ? 'ปิดบริการ'
                              : 'เปิดบริการ'}
                          </span>
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            service.id
                          }
                          onClick={() =>
                            void handleDelete(
                              service
                            )
                          }
                          className="
                            inline-flex
                            h-11
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-red-50
                            px-3
                            text-xs
                            font-bold
                            text-red-600
                            transition
                            hover:bg-red-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {deletingId ===
                          service.id ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 shrink-0" />
                          )}

                          <span>
                            ลบ
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
 * TOAST NOTIFICATION
 * ======================================================= */

interface ToastNotificationProps {
  message: string;
  error: string;
  onCloseMessage: () => void;
  onCloseError: () => void;
}

function ToastNotification({
  message,
  error,
  onCloseMessage,
  onCloseError,
}: ToastNotificationProps) {
  if (
    !message &&
    !error
  ) {
    return null;
  }

  return (
    <div
      className="
        pointer-events-none
        fixed
        right-4
        top-4
        z-9999
        flex
        w-[calc(100%-2rem)]
        max-w-sm
        flex-col
        gap-3
        sm:right-6
        sm:top-6
      "
      aria-live="polite"
      aria-atomic="true"
    >
      {/* SUCCESS */}

      {message && (
        <div
          className="
            pointer-events-auto
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-emerald-200
            bg-white
            p-4
            shadow-xl
          "
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-800">
              สำเร็จ
            </p>

            <p className="mt-1 wrap-break-word text-xs leading-5 text-slate-500">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onCloseMessage
            }
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div
          className="
            pointer-events-auto
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-200
            bg-white
            p-4
            shadow-xl
          "
          role="alert"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-800">
              ไม่สามารถดำเนินการได้
            </p>

            <p className="mt-1 wrap-break-word text-xs leading-5 text-slate-500">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onCloseError
            }
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}