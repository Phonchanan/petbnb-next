'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  QrCode,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';

import {
  createPayment,
  formatPaymentAmount,
  formatPaymentDate,
  getPaymentByBookingId,
  isPaymentPaid,
  simulatePaymentSuccess,
  type Payment,
} from '@/lib/supabase/paymentService';

import { supabase } from '@/lib/supabase/client';

interface BookingData {
  id: string;
  booking_code: string | null;
  total_price: number | string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function OwnerPaymentPage() {
  const params = useParams();
  const router = useRouter();

  const bookingId =
    typeof params.bookingId === 'string'
      ? params.bookingId
      : '';

  const [
    booking,
    setBooking,
  ] = useState<BookingData | null>(
    null
  );

  const [
    payment,
    setPayment,
  ] = useState<Payment | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    paying,
    setPaying,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  /* =======================================================
   * LOAD BOOKING + PAYMENT
   * ===================================================== */

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const {
          data: bookingData,
          error: bookingError,
        } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_code,
            total_price,
            status,
            start_date,
            end_date
          `)
          .eq('id', bookingId)
          .single();

        if (bookingError) {
          throw bookingError;
        }

        setBooking(
          bookingData as BookingData
        );

        const existingPayment =
          await getPaymentByBookingId(
            bookingId
          );

        /*
         * ถ้ายังไม่มี Payment
         * และ Booking ถูกยืนยันแล้ว
         * ให้สร้าง Payment
         */
        if (
          !existingPayment &&
          bookingData.status ===
            'CONFIRMED'
        ) {
          const newPayment =
            await createPayment(
              bookingId
            );

          setPayment(newPayment);
        } else {
          setPayment(
            existingPayment
          );
        }
      } catch (err) {
        console.error(
          'load payment page error:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดข้อมูลการชำระเงินได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bookingId]);

  /* =======================================================
   * SIMULATE PAYMENT
   * ===================================================== */

  const handlePayment = async () => {
    if (!payment) {
      return;
    }

    try {
      setPaying(true);
      setError('');

      const paidPayment =
        await simulatePaymentSuccess(
          payment.id
        );

      setPayment(paidPayment);
    } catch (err) {
      console.error(
        'payment error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถชำระเงินได้'
      );
    } finally {
      setPaying(false);
    }
  };

  /* =======================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </main>
    );
  }

  /* =======================================================
   * ERROR
   * ===================================================== */

  if (error && !booking) {
    return (
      <main className="min-h-screen bg-[#FAF8FE] p-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-6 text-center">
          <p className="font-bold text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!booking) {
    return null;
  }

  const paid =
    isPaymentPaid(payment);

  /* =======================================================
   * PAGE
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push(`/owner/bookings/${booking.id}`)}
          className="mb-5 inline-flex items-center gap-2 text-xs font-black text-purple-600 transition hover:text-purple-800"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้ารายละเอียดการจอง
        </button>

        <section className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/35 blur-2xl" />
          <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
            PetBnB Payment
          </p>
          <h1 className="relative mt-2 text-2xl font-black tracking-tight text-purple-950 sm:text-3xl">
            {paid ? 'ชำระเงินสำเร็จ' : 'ชำระค่าบริการ'}
          </h1>
          <p className="relative mt-2 text-sm font-medium text-purple-950/60">
            การจอง {booking.booking_code || booking.id}
          </p>
        </section>

        {/* PAYMENT CARD */}

        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
          <div className="border-b border-purple-100/70 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E8FF] text-purple-600">
                <ReceiptText className="h-5 w-5" />
              </div>

              <div>
                <p className="font-black text-slate-800">
                  รายละเอียดการชำระเงิน
                </p>

                <p className="text-xs text-slate-400">
                  {paid ? 'บันทึกรายการเรียบร้อยแล้ว' : 'ชำระผ่าน PromptPay QR Code'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* AMOUNT */}

            <div className="rounded-[22px] bg-[#F8F4FF] p-5 text-center">
              <p className="text-xs font-semibold text-slate-500">
                ยอดชำระทั้งหมด
              </p>

              <p className="mt-2 text-4xl font-black text-purple-700">
                {formatPaymentAmount(
                  Number(
                    booking.total_price
                  )
                )}
              </p>
            </div>

            {!paid ? (
              <>
                {/* DEMO QR */}

                <div className="mt-6 grid gap-5 md:grid-cols-[1fr_240px] md:items-center">
                  <div>
                    <p className="text-sm font-black text-purple-950">
                      ขั้นตอนการชำระเงิน
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {[
                        'ตรวจสอบยอดชำระให้ถูกต้อง',
                        'สแกน QR Code ผ่านแอปธนาคาร',
                        'สำหรับโครงงาน ให้กดปุ่มจำลองการชำระเงิน',
                      ].map((step, index) => (
                        <div key={step} className="flex items-center gap-3 rounded-2xl bg-[#FBF9FE] p-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-black text-purple-700">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex h-56 w-full items-center justify-center rounded-[24px] border-2 border-dashed border-purple-200 bg-white">
                    <div className="text-center">
                      <QrCode className="mx-auto h-24 w-24 text-purple-800" />

                      <p className="mt-3 text-xs font-bold text-purple-600">
                        DEMO QR PAYMENT
                      </p>
                    </div>
                  </div>
                </div>

                {/* STATUS */}

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs font-black text-amber-800">
                    สถานะการชำระเงิน
                  </p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-700">รอชำระเงิน</span>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                    {error}
                  </div>
                )}

                {/* DEMO BUTTON */}

                <button
                  type="button"
                  disabled={
                    paying ||
                    !payment
                  }
                  onClick={
                    handlePayment
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-5 py-3.5 text-sm font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.20)] transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      ยืนยันการชำระเงิน (โหมดจำลอง)
                    </>
                  )}
                </button>
              </>
            ) : (
              /* SUCCESS */

              <div className="mt-7 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <h2 className="mt-4 text-2xl font-black text-emerald-700">
                  ชำระเงินสำเร็จ
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  ระบบบันทึกยอดชำระและพักยอดไว้ จนกว่าการให้บริการจะเสร็จสิ้น
                </p>

                <div className="mt-6 space-y-3 rounded-[22px] bg-[#F8F4FF] p-5 text-left text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      ยอดชำระ
                    </span>

                    <span className="font-black text-slate-800">
                      {formatPaymentAmount(
                        payment?.amount
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-purple-100 pt-3">
                    <span className="text-slate-500">
                      การคุ้มครองยอดชำระ
                    </span>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                      {payment?.escrow_status ===
                      'HELD'
                        ? 'กำลังพักยอด'
                        : payment?.escrow_status ||
                          '-'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      เลขอ้างอิง
                    </span>

                    <span className="font-bold text-slate-800">
                      {payment
                        ?.transaction_ref ||
                        '-'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      วันที่ชำระ
                    </span>

                    <span className="font-bold text-slate-800">
                      {formatPaymentDate(
                        payment?.paid_at
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-3 rounded-[22px] bg-emerald-50 p-4 text-left">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-black text-emerald-800">ระบบพักยอดอัตโนมัติ</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      เมื่อผู้รับฝากแจ้งจบงาน ระบบจะดำเนินการปล่อยยอดตามขั้นตอนที่กำหนดโดยอัตโนมัติ
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/owner/bookings'
                    )
                  }
                  className="mt-6 w-full rounded-2xl bg-[#7C3AED] px-5 py-3.5 text-sm font-black text-white transition hover:bg-purple-700"
                >
                  กลับไปยังรายการจอง
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
