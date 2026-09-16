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
  CheckCircle2,
  Loader2,
  QrCode,
  ReceiptText,
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
    <main className="min-h-screen bg-[#FAF8FE] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* HEADER */}

        <div className="mb-6 text-center">
          <p className="text-sm font-bold text-purple-600">
            PetBnB Payment
          </p>

          <h1 className="mt-2 text-3xl font-black text-purple-950">
            การชำระเงิน
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            รหัสการจอง{' '}
            {booking.booking_code ||
              booking.id}
          </p>
        </div>

        {/* PAYMENT CARD */}

        <div className="overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-sm">
          <div className="border-b border-purple-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <ReceiptText className="h-5 w-5" />
              </div>

              <div>
                <p className="font-black text-slate-800">
                  รายละเอียดการชำระเงิน
                </p>

                <p className="text-xs text-slate-400">
                  PromptPay QR Code
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* AMOUNT */}

            <div className="rounded-2xl bg-purple-50/70 p-5 text-center">
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

                <div className="mt-7 flex flex-col items-center">
                  <div className="flex h-56 w-56 items-center justify-center rounded-3xl border-2 border-dashed border-purple-200 bg-white">
                    <div className="text-center">
                      <QrCode className="mx-auto h-28 w-28 text-purple-800" />

                      <p className="mt-3 text-xs font-bold text-purple-600">
                        DEMO QR PAYMENT
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-700">
                    สแกน QR Code เพื่อชำระเงิน
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    ระบบจำลองการชำระเงินสำหรับโครงงาน
                  </p>
                </div>

                {/* STATUS */}

                <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-700">
                    สถานะ: รอการชำระเงิน
                  </p>
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
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      จำลองการชำระเงินสำเร็จ
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

                <p className="mt-2 text-sm text-slate-500">
                  การชำระเงินของคุณได้รับการบันทึกเรียบร้อยแล้ว
                </p>

                <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5 text-left text-sm">
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

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/owner/bookings'
                    )
                  }
                  className="mt-6 w-full rounded-2xl bg-purple-600 px-5 py-3.5 text-sm font-black text-white hover:bg-purple-700"
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