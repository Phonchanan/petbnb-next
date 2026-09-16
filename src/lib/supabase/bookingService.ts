import { supabase } from '@/lib/supabase/client';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Booking {
  id: string;
  bookingCode: string | null;

  ownerId: string;
  sitterId: string;
  petId: string;
  serviceId: string;

  startDate: string;
  endDate: string;

  dailyRate: number | null;
  totalPrice: number;

  petCount: number | null;

  status: BookingStatus;

  ownerPhone: string | null;
  ownerNote: string | null;
  sitterNote: string | null;
  rejectionReason: string | null;

  addOns: unknown;

  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  ownerId: string;
  sitterId: string;
  petId: string;
  serviceId: string;

  startDate: string;
  endDate: string;

  dailyRate: number;
  totalPrice: number;

  ownerPhone?: string;
  ownerNote?: string;

  petCount?: number;
  addOns?: unknown;
}

export interface UpdateBookingStatusInput {
  bookingId: string;
  sitterProfileId: string;

  status:
    | 'CONFIRMED'
    | 'REJECTED'
    | 'IN_PROGRESS'
    | 'COMPLETED';

  sitterNote?: string;
  rejectionReason?: string;
}

interface BookingRow {
  id: string;
  booking_code: string | null;

  owner_id: string;
  sitter_id: string;
  pet_id: string;
  service_id: string;

  start_date: string;
  end_date: string;

  daily_rate:
    | number
    | string
    | null;

  total_price:
    | number
    | string;

  pet_count: number | null;

  status: string;

  owner_phone: string | null;

  owner_note: string | null;
  sitter_note: string | null;

  rejection_reason: string | null;

  add_ons: unknown;

  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  created_at: string;
  updated_at: string;
}

function mapBooking(
  row: BookingRow
): Booking {
  return {
    id: row.id,

    bookingCode:
      row.booking_code,

    ownerId:
      row.owner_id,

    sitterId:
      row.sitter_id,

    petId:
      row.pet_id,

    serviceId:
      row.service_id,

    startDate:
      row.start_date,

    endDate:
      row.end_date,

    dailyRate:
      row.daily_rate !== null
        ? Number(row.daily_rate)
        : null,

    totalPrice:
      Number(row.total_price),

    petCount:
      row.pet_count,

    status:
      row.status as BookingStatus,

    ownerPhone:
      row.owner_phone,

    ownerNote:
      row.owner_note,

    sitterNote:
      row.sitter_note,

    rejectionReason:
      row.rejection_reason,

    addOns:
      row.add_ons,

    confirmedAt:
      row.confirmed_at,

    startedAt:
      row.started_at,

    completedAt:
      row.completed_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

export const BookingService = {
  async createBooking(
    input: CreateBookingInput
  ): Promise<Booking> {
    if (!input.ownerId) {
      throw new Error(
        'ไม่พบข้อมูลเจ้าของสัตว์เลี้ยง'
      );
    }

    if (!input.sitterId) {
      throw new Error(
        'ไม่พบข้อมูลผู้รับฝาก'
      );
    }

    if (!input.petId) {
      throw new Error(
        'กรุณาเลือกสัตว์เลี้ยง'
      );
    }

    if (!input.serviceId) {
      throw new Error(
        'ไม่พบบริการที่เลือก'
      );
    }

    if (
      !input.startDate ||
      !input.endDate
    ) {
      throw new Error(
        'กรุณาระบุวันที่เริ่มและวันที่สิ้นสุด'
      );
    }

    if (input.dailyRate < 0) {
      throw new Error(
        'ราคาต่อวันไม่ถูกต้อง'
      );
    }

    if (input.totalPrice < 0) {
      throw new Error(
        'ยอดรวมไม่ถูกต้อง'
      );
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'GET SESSION ERROR:',
        sessionError
      );

      throw new Error(
        'ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้'
      );
    }

    if (!session?.user) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่ก่อนทำการจอง'
      );
    }

    if (
      session.user.id !== input.ownerId
    ) {
      throw new Error(
        'บัญชีผู้ใช้ไม่ตรงกับเจ้าของการจอง'
      );
    }

    const payload = {
      owner_id:
        input.ownerId,

      sitter_id:
        input.sitterId,

      pet_id:
        input.petId,

      service_id:
        input.serviceId,

      start_date:
        input.startDate,

      end_date:
        input.endDate,

      daily_rate:
        input.dailyRate,

      total_price:
        input.totalPrice,

      status:
        'PENDING',

      owner_phone:
        input.ownerPhone?.trim() ||
        null,

      owner_note:
        input.ownerNote?.trim() ||
        null,

      sitter_note:
        null,

      rejection_reason:
        null,

      pet_count:
        input.petCount ?? 1,

      add_ons:
        input.addOns ?? null,

      confirmed_at:
        null,

      started_at:
        null,

      completed_at:
        null,

      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabase
        .from('bookings')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
      console.error(
        'CREATE BOOKING ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถสร้างการจองได้'
      );
    }

    return mapBooking(
      data as BookingRow
    );
  },

  async getBookingsByOwner(
    ownerId: string
  ): Promise<Booking[]> {
    if (!ownerId) {
      return [];
    }

    const { data, error } =
      await supabase
        .from('bookings')
        .select('*')
        .eq(
          'owner_id',
          ownerId
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        'GET OWNER BOOKINGS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลการจองได้'
      );
    }

    return (
      (data ?? []) as BookingRow[]
    ).map(mapBooking);
  },

  async getBookingsBySitter(
    sitterProfileId: string
  ): Promise<Booking[]> {
    if (!sitterProfileId) {
      return [];
    }

    const { data, error } =
      await supabase
        .from('bookings')
        .select('*')
        .eq(
          'sitter_id',
          sitterProfileId
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        'GET SITTER BOOKINGS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดคำขอจองได้'
      );
    }

    return (
      (data ?? []) as BookingRow[]
    ).map(mapBooking);
  },

  async getBookingById(
    bookingId: string
  ): Promise<Booking | null> {
    if (!bookingId) {
      return null;
    }

    const { data, error } =
      await supabase
        .from('bookings')
        .select('*')
        .eq(
          'id',
          bookingId
        )
        .maybeSingle();

    if (error) {
      console.error(
        'GET BOOKING ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลการจองได้'
      );
    }

    if (!data) {
      return null;
    }

    return mapBooking(
      data as BookingRow
    );
  },

  async cancelBooking(
    bookingId: string
  ): Promise<void> {
    if (!bookingId) {
      throw new Error(
        'ไม่พบรหัสการจอง'
      );
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(
        'ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้'
      );
    }

    if (!session?.user) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่'
      );
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from('bookings')
      .select(`
        id,
        owner_id,
        status
      `)
      .eq(
        'id',
        bookingId
      )
      .maybeSingle();

    if (bookingError) {
      console.error(
        'GET BOOKING BEFORE CANCEL ERROR:',
        bookingError
      );

      throw new Error(
        bookingError.message
      );
    }

    if (!booking) {
      throw new Error(
        'ไม่พบข้อมูลการจอง'
      );
    }

    if (
      booking.owner_id !==
      session.user.id
    ) {
      throw new Error(
        'คุณไม่มีสิทธิ์ยกเลิกการจองนี้'
      );
    }

    /*
     * Owner ยกเลิกได้เฉพาะตอนที่
     * Sitter ยังไม่ตอบรับเท่านั้น
     */
    if (
      booking.status !== 'PENDING'
    ) {
      throw new Error(
        'ไม่สามารถยกเลิกการจองได้ เนื่องจากผู้รับฝากยืนยันการจองแล้ว'
      );
    }

    const {
      data: updatedBooking,
      error,
    } = await supabase
      .from('bookings')
      .update({
        status:
          'CANCELLED',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        bookingId
      )
      .eq(
        'owner_id',
        session.user.id
      )
      /*
       * กันกรณี Sitter กดยืนยันพร้อมกับ
       * Owner กดยกเลิก
       */
      .eq(
        'status',
        'PENDING'
      )
      .select('id')
      .maybeSingle();

    if (error) {
      console.error(
        'CANCEL BOOKING ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถยกเลิกการจองได้'
      );
    }

    if (!updatedBooking) {
      throw new Error(
        'ไม่สามารถยกเลิกได้ เนื่องจากสถานะการจองมีการเปลี่ยนแปลงแล้ว'
      );
    }
  },

  async updateBookingStatus(
    input: UpdateBookingStatusInput
  ): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'GET SESSION ERROR:',
        sessionError
      );

      throw new Error(
        'ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้'
      );
    }

    if (!session?.user) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่'
      );
    }

    const {
      data: sitterProfile,
      error: sitterError,
    } = await supabase
      .from('sitter_profiles')
      .select(`
        id,
        user_id
      `)
      .eq(
        'id',
        input.sitterProfileId
      )
      .eq(
        'user_id',
        session.user.id
      )
      .maybeSingle();

    if (sitterError) {
      console.error(
        'GET SITTER PROFILE ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message
      );
    }

    if (!sitterProfile) {
      throw new Error(
        'คุณไม่มีสิทธิ์จัดการการจองนี้'
      );
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from('bookings')
      .select(`
        id,
        sitter_id,
        status
      `)
      .eq(
        'id',
        input.bookingId
      )
      .eq(
        'sitter_id',
        input.sitterProfileId
      )
      .maybeSingle();

    if (bookingError) {
      console.error(
        'GET BOOKING BEFORE UPDATE STATUS ERROR:',
        bookingError
      );

      throw new Error(
        bookingError.message
      );
    }

    if (!booking) {
      throw new Error(
        'ไม่พบข้อมูลการจอง'
      );
    }

    if (
      input.status === 'CONFIRMED' &&
      booking.status !== 'PENDING'
    ) {
      throw new Error(
        'ยืนยันได้เฉพาะคำขอที่กำลังรอการตอบรับ'
      );
    }

    if (
      input.status === 'REJECTED' &&
      booking.status !== 'PENDING'
    ) {
      throw new Error(
        'ปฏิเสธได้เฉพาะคำขอที่กำลังรอการตอบรับ'
      );
    }

    if (
      input.status === 'IN_PROGRESS'
    ) {
      if (
        booking.status !== 'CONFIRMED'
      ) {
        throw new Error(
          'เริ่มให้บริการได้เฉพาะการจองที่ยืนยันแล้ว'
        );
      }

      /*
       * ก่อนเริ่มให้บริการ
       * ต้องมี Payment ที่ชำระแล้ว
       */
      const {
        data: payment,
        error: paymentError,
      } = await supabase
        .from('payments')
        .select(`
          id,
          payment_status
        `)
        .eq(
          'booking_id',
          input.bookingId
        )
        .eq(
          'payment_status',
          'PAID'
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (paymentError) {
        console.error(
          'CHECK PAYMENT BEFORE START ERROR:',
          paymentError
        );

        throw new Error(
          'ไม่สามารถตรวจสอบสถานะการชำระเงินได้'
        );
      }

      if (!payment) {
        throw new Error(
          'ยังไม่สามารถเริ่มให้บริการได้ เนื่องจากเจ้าของยังไม่ได้ชำระเงิน'
        );
      }
    }

    if (
      input.status === 'COMPLETED' &&
      booking.status !== 'IN_PROGRESS'
    ) {
      throw new Error(
        'จบงานได้เฉพาะการจองที่กำลังให้บริการ'
      );
    }

    const now =
      new Date().toISOString();

    const payload: {
      status: BookingStatus;
      sitter_note?: string | null;
      rejection_reason?: string | null;
      confirmed_at?: string | null;
      started_at?: string | null;
      completed_at?: string | null;
      updated_at: string;
    } = {
      status:
        input.status,

      updated_at:
        now,
    };

    if (
      input.sitterNote !== undefined
    ) {
      payload.sitter_note =
        input.sitterNote.trim() ||
        null;
    }

    if (
      input.status === 'CONFIRMED'
    ) {
      payload.confirmed_at =
        now;

      payload.rejection_reason =
        null;
    }

    if (
      input.status === 'REJECTED'
    ) {
      payload.rejection_reason =
        input.rejectionReason?.trim() ||
        'ผู้รับฝากปฏิเสธคำขอ';

      payload.confirmed_at =
        null;
    }

    if (
      input.status === 'IN_PROGRESS'
    ) {
      payload.started_at =
        now;
    }

    if (
      input.status === 'COMPLETED'
    ) {
      payload.completed_at =
        now;
    }

    const { error } =
      await supabase
        .from('bookings')
        .update(payload)
        .eq(
          'id',
          input.bookingId
        )
        .eq(
          'sitter_id',
          input.sitterProfileId
        );

    if (error) {
      console.error(
        'UPDATE BOOKING STATUS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถอัปเดตสถานะการจองได้'
      );
    }
  },
};