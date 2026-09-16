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
        message={message}
        error={error}
        onCloseMessage={() => {
          clearToastTimer();
          setMessage('');
        }}
        onCloseError={() => {
          clearToastTimer();
          setError('');
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
         * PAGE HEADER
         * =============================================== */}

        <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
              Service Management
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-purple-950 sm:text-3xl">
              บริการของฉัน
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              จัดการบริการ ราคา และประเภทสัตว์ที่คุณผ่านการรับรอง
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-2.5 text-[10px] font-black text-purple-700 shadow-sm ring-1 ring-purple-100">
            {services.length} บริการ
          </div>
        </section>

        {/* =================================================
         * HERO
         * =============================================== */}

        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E7D6FF] to-[#DCC6FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-[9px] font-black text-purple-700">
              <BadgeCheck className="h-3 w-3" />
              Certified Services
            </div>

            <h2 className="mt-4 text-xl font-black text-[#32105C] sm:text-2xl">
              สร้างบริการจากประเภทสัตว์ที่คุณผ่านการรับรอง
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-purple-900/60">
              คุณสามารถเพิ่มบริการได้เฉพาะประเภทสัตว์ที่ผ่านแบบทดสอบและได้รับสถานะ CERTIFIED แล้ว
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <div className="rounded-2xl bg-white/70 px-4 py-3 text-[10px] font-bold text-amber-700">
                  ยังไม่มีประเภทสัตว์ที่ผ่านการรับรอง
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.categoryId}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-3.5 py-2.5 shadow-sm"
                  >
                    <span className="text-lg">
                      {category.icon || '🐾'}
                    </span>

                    <div>
                      <p className="text-[10px] font-black text-purple-950">
                        {category.nameTh}
                      </p>

                      <p className="mt-0.5 text-[8px] font-black text-emerald-600">
                        CERTIFIED
                      </p>
                    </div>

                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* =================================================
         * CONTENT
         * =============================================== */}

        <section className="mt-5 grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* FORM */}

          <article className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                  {editingServiceId ? 'Edit Service' : 'New Service'}
                </p>

                <h2 className="mt-1 text-base font-black text-purple-950">
                  {editingServiceId
                    ? 'แก้ไขบริการ'
                    : 'เพิ่มบริการ'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  กำหนดรายละเอียดบริการและราคา
                </p>
              </div>

              {editingServiceId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                  ยกเลิก
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-black text-slate-500">
                  ประเภทสัตว์
                </label>

                <select
                  value={form.categoryId}
                  disabled={categories.length === 0}
                  onChange={(event) =>
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

                  {categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black text-slate-500">
                  ชื่อบริการ
                </label>

                <input
                  value={form.serviceName}
                  onChange={(event) =>
                    setField(
                      'serviceName',
                      event.target.value
                    )
                  }
                  placeholder="เช่น รับฝากรายวัน"
                  className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black text-slate-500">
                    ราคา
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(event) =>
                      setField(
                        'price',
                        event.target.value
                      )
                    }
                    placeholder="เช่น 250"
                    className="w-full rounded-2xl border border-purple-100 bg-[#FCFAFF] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black text-slate-500">
                    หน่วยราคา
                  </label>

                  <select
                    value={form.priceUnit}
                    onChange={(event) =>
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
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black text-slate-500">
                  รายละเอียดบริการ
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
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
                categories.length === 0
              }
              onClick={() =>
                void handleSave()
              }
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 text-xs font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.18)] transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          </article>

          {/* SERVICE LIST */}

          <article className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                  My Services
                </p>

                <h2 className="mt-1 text-base font-black text-purple-950">
                  บริการที่สร้างไว้
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Owner จะเห็นเฉพาะบริการที่เปิดใช้งาน
                </p>
              </div>

              <div className="rounded-2xl bg-purple-50 px-3 py-2 text-[10px] font-black text-purple-700">
                {services.length} รายการ
              </div>
            </div>

            {services.length === 0 ? (
              <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-[24px] bg-[#F8F4FF] px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-purple-300 shadow-sm">
                  <Plus className="h-6 w-6" />
                </div>

                <p className="mt-3 text-sm font-black text-purple-950">
                  ยังไม่มีบริการ
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  เพิ่มบริการแรกของคุณจากแบบฟอร์มด้านซ้าย
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {services.map((service) => {
                  const category =
                    categoryMap.get(
                      service.categoryId
                    );

                  return (
                    <article
                      key={service.id}
                      className="rounded-[24px] bg-[#FAF7FE] p-4 transition hover:bg-[#F6F0FF]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="wrap-break-word text-sm font-black text-purple-950">
                              {service.serviceName}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[8px] font-black ${
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

                          <p className="mt-2 text-[10px] font-black text-purple-600">
                            {category?.icon || '🐾'}{' '}
                            {category?.nameTh ||
                              service.categoryId}
                          </p>

                          {service.description ? (
                            <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-slate-500">
                              {service.description}
                            </p>
                          ) : (
                            <p className="mt-2 text-[10px] text-slate-300">
                              ไม่มีรายละเอียดเพิ่มเติม
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="text-lg font-black text-purple-700">
                            ฿
                            {service.price.toLocaleString(
                              'th-TH'
                            )}
                          </p>

                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {service.priceUnit ===
                            'NIGHT'
                              ? 'ต่อคืน'
                              : 'ต่อวัน'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-purple-100 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              service
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[10px] font-black text-purple-700 shadow-sm transition hover:bg-purple-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          แก้ไข
                        </button>

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
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[10px] font-black text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {togglingId ===
                          service.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}

                          {service.isActive
                            ? 'ปิดบริการ'
                            : 'เปิดบริการ'}
                        </button>

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
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-[10px] font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          {deletingId ===
                          service.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}

                          ลบ
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </section>
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