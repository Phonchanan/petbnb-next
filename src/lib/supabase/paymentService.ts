import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * TYPES
 * ======================================================= */

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'PROMPTPAY';

export type EscrowStatus =
  | 'NOT_HELD'
  | 'HELD'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface Payment {
  id: string;
  booking_id: string;

  amount: number;
  commission_fee: number | null;
  net_amount: number;

  payment_method:
    | PaymentMethod
    | string
    | null;

  payment_status:
    | PaymentStatus
    | string
    | null;

  escrow_status:
    | EscrowStatus
    | string
    | null;

  transaction_ref:
    | string
    | null;

  paid_at:
    | string
    | null;

  released_at?:
    | string
    | null;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
}

/* =========================================================
 * GET PAYMENT BY BOOKING
 * ======================================================= */

export async function getPaymentByBookingId(
  bookingId: string
): Promise<Payment | null> {
  if (!bookingId) {
    throw new Error(
      'ไม่พบ booking id'
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('payments')
    .select('*')
    .eq(
      'booking_id',
      bookingId
    )
    .maybeSingle();

  if (error) {
    console.error(
      'getPaymentByBookingId error:',
      error
    );

    throw new Error(
      error.message
    );
  }

  return data as Payment | null;
}

/* =========================================================
 * GET PAYMENT BY ID
 * ======================================================= */

export async function getPaymentById(
  paymentId: string
): Promise<Payment | null> {
  if (!paymentId) {
    throw new Error(
      'ไม่พบ payment id'
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('payments')
    .select('*')
    .eq(
      'id',
      paymentId
    )
    .maybeSingle();

  if (error) {
    console.error(
      'getPaymentById error:',
      error
    );

    throw new Error(
      error.message
    );
  }

  return data as Payment | null;
}

/* =========================================================
 * CREATE PAYMENT
 * ======================================================= */

/**
 * สร้าง Payment ผ่าน RPC เท่านั้น
 *
 * RPC:
 * create_payment_for_booking(
 *   p_booking_id uuid
 * )
 *
 * จุดสำคัญ:
 * - ไม่รับ amount จาก client
 * - Supabase อ่าน total_price จาก bookings เอง
 * - ตรวจว่า booking เป็นของ owner ปัจจุบัน
 * - booking ต้องเป็น CONFIRMED
 * - 1 booking มีได้ 1 payment
 */
export async function createPayment(
  bookingId: string
): Promise<Payment> {
  if (!bookingId) {
    throw new Error(
      'ไม่พบ booking id'
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'create_payment_for_booking',
    {
      p_booking_id:
        bookingId,
    }
  );

  if (error) {
    console.error(
      'createPayment error:',
      error
    );

    throw new Error(
      error.message
    );
  }

  return data as Payment;
}

/* =========================================================
 * SIMULATE PAYMENT SUCCESS AND HOLD ESCROW
 * ======================================================= */

/**
 * ใช้สำหรับ Demo Payment
 *
 * RPC:
 * simulate_payment_and_hold(
 *   p_payment_id uuid
 * )
 *
 * เปลี่ยน:
 * payment_status: PENDING -> PAID
 * escrow_status: NOT_HELD -> HELD
 *
 * พร้อมบันทึก:
 * paid_at
 * transaction_ref
 * commission_fee 10%
 * net_amount
 */
export async function simulatePaymentSuccess(
  paymentId: string
): Promise<Payment> {
  if (!paymentId) {
    throw new Error(
      'ไม่พบ payment id'
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'simulate_payment_and_hold',
    {
      p_payment_id:
        paymentId,
    }
  );

  if (error) {
    console.error(
      'simulatePaymentSuccess error:',
      error
    );

    throw new Error(
      error.message
    );
  }

  return data as Payment;
}

/* =========================================================
 * RELEASE ESCROW
 * ======================================================= */

/**
 * เจ้าของยืนยันหลัง Booking เสร็จสิ้น แล้วระบบจำลองการ
 * ปล่อยยอดสุทธิให้ผู้รับฝาก
 */
export async function releaseEscrowForBooking(
  bookingId: string
): Promise<Payment> {
  if (!bookingId) {
    throw new Error('ไม่พบ booking id');
  }

  const { data, error } = await supabase.rpc(
    'release_escrow_for_booking',
    {
      p_booking_id: bookingId,
    }
  );

  if (error) {
    console.error(
      'releaseEscrowForBooking error:',
      error
    );

    throw new Error(error.message);
  }

  return data as Payment;
}

/* =========================================================
 * PAYMENT STATUS HELPERS
 * ======================================================= */

export function isPaymentPaid(
  payment:
    | Payment
    | null
    | undefined
): boolean {
  return (
    payment?.payment_status ===
    'PAID'
  );
}

export function isPaymentPending(
  payment:
    | Payment
    | null
    | undefined
): boolean {
  return (
    payment?.payment_status ===
    'PENDING'
  );
}

/* =========================================================
 * FORMAT MONEY
 * ======================================================= */

export function formatPaymentAmount(
  amount?:
    | number
    | null
): string {
  const value =
    Number(
      amount ?? 0
    );

  return new Intl.NumberFormat(
    'th-TH',
    {
      style:
        'currency',

      currency:
        'THB',

      minimumFractionDigits:
        2,
    }
  ).format(
    value
  );
}

/* =========================================================
 * FORMAT PAYMENT DATE
 * ======================================================= */

export function formatPaymentDate(
  date?:
    | string
    | null
): string {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'th-TH',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',

      timeZone:
        'Asia/Bangkok',
    }
  ).format(
    new Date(
      date
    )
  );
}
