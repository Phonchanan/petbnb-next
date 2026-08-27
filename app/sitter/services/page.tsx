/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
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

const initialForm:
  ServiceForm = {
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
  ] =
    useState<ServiceForm>(
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

          setError(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถโหลดข้อมูลบริการได้'
          );
        } finally {
          setLoading(false);
        }
      },
      []
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

      setError('');
    };

  /* =======================================================
   * EDIT
   * ===================================================== */

  const handleEdit =
    (
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
        return;
      }

      if (
        !form.categoryId
      ) {
        setError(
          'กรุณาเลือกประเภทสัตว์'
        );
        return;
      }

      if (
        !form.serviceName.trim()
      ) {
        setError(
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
        setError(
          'กรุณาระบุราคาที่ถูกต้อง'
        );
        return;
      }

      /*
       * ตรวจจาก category ที่โหลดมา
       * ซึ่งมีเฉพาะ CERTIFIED
       */
      if (
        !categoryMap.has(
          form.categoryId
        )
      ) {
        setError(
          'คุณยังไม่ผ่านการรับรองสำหรับประเภทสัตว์นี้'
        );
        return;
      }

      try {
        setSaving(true);
        setError('');
        setMessage('');

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

          setMessage(
            'แก้ไขบริการเรียบร้อยแล้ว'
          );
        } else {
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

          setMessage(
            'เพิ่มบริการเรียบร้อยแล้ว'
          );
        }

        resetForm();
      } catch (err) {
        setError(
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
      const confirmed =
        window.confirm(
          `ต้องการลบบริการ "${service.serviceName}" หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          service.id
        );

        setError('');
        setMessage('');

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

        setMessage(
          'ลบบริการเรียบร้อยแล้ว'
        );
      } catch (err) {
        setError(
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

        setMessage(
          nextValue
            ? 'เปิดบริการเรียบร้อยแล้ว'
            : 'ปิดบริการเรียบร้อยแล้ว'
        );
      } catch (err) {
        setError(
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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* HEADER */}

        <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
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

        {/* MESSAGE */}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />

            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            {error}
          </div>
        )}

        {/* CERTIFIED CATEGORIES */}

        <section className="mt-5 rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
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
                (category) => (
                  <div
                    key={
                      category.categoryId
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"
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

        {/* FORM */}

        <section className="mt-5 rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
              >
                <X className="h-4 w-4" />

                ยกเลิก
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none disabled:opacity-50"
              >
                <option value="">
                  เลือกประเภทสัตว์ที่ผ่านการรับรอง
                </option>

                {categories.map(
                  (category) => (
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

            {/* NAME */}

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
                className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
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
                className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
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
                className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm outline-none"
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
                className="w-full resize-none rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm leading-6 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
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
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* SERVICES */}

        <section className="mt-5">
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
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {services.map(
                (service) => {
                  const category =
                    categoryMap.get(
                      service.categoryId
                    );

                  return (
                    <article
                      key={
                        service.id
                      }
                      className="rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-purple-950">
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

                        <p className="text-lg font-black text-purple-700">
                          ฿
                          {service.price.toLocaleString(
                            'th-TH'
                          )}
                        </p>
                      </div>

                      {service.description && (
                        <p className="mt-3 text-xs leading-6 text-slate-500">
                          {
                            service.description
                          }
                        </p>
                      )}

                      <p className="mt-2 text-[10px] text-slate-400">
                        {service.priceUnit ===
                        'NIGHT'
                          ? 'ราคาต่อคืน'
                          : 'ราคาต่อวัน'}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              service
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700"
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
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
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
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
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
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}