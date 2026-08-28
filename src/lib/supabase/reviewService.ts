import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * TYPES
 * ======================================================= */

export interface Review {
  id: string;

  bookingId: string;
  ownerId: string;
  sitterId: string;

  rating: number;
  comment: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  bookingId: string;
  sitterId: string;

  rating: number;
  comment?: string;
}

export interface SitterRatingSummary {
  averageRating: number;
  reviewCount: number;
}

/* =========================================================
 * DATABASE ROW
 * ======================================================= */

interface ReviewRow {
  id: string;

  booking_id: string;
  owner_id: string;
  sitter_id: string;

  rating: number;
  comment: string | null;

  created_at: string;
  updated_at: string;
}

/* =========================================================
 * MAP REVIEW
 * ======================================================= */

function mapReview(
  row: ReviewRow
): Review {
  return {
    id: row.id,

    bookingId:
      row.booking_id,

    ownerId:
      row.owner_id,

    sitterId:
      row.sitter_id,

    rating:
      Number(row.rating),

    comment:
      row.comment,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* =========================================================
 * REVIEW SERVICE
 * ======================================================= */

export const ReviewService = {
  /* =======================================================
   * GET REVIEW BY BOOKING
   * ===================================================== */

  async getByBookingId(
    bookingId: string
  ): Promise<Review | null> {
    if (!bookingId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from('reviews')
      .select('*')
      .eq(
        'booking_id',
        bookingId
      )
      .maybeSingle();

    if (error) {
      console.error(
        'GET REVIEW BY BOOKING ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดรีวิวได้'
      );
    }

    if (!data) {
      return null;
    }

    return mapReview(
      data as ReviewRow
    );
  },

  /* =======================================================
   * CHECK BOOKING CAN REVIEW
   * ===================================================== */

  async canReviewBooking(
    bookingId: string
  ): Promise<boolean> {
    if (!bookingId) {
      return false;
    }

    /* -----------------------------------------------------
     * CHECK SESSION
     * --------------------------------------------------- */

    const {
      data: {
        session,
      },
      error:
        sessionError,
    } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'GET SESSION ERROR:',
        sessionError
      );

      return false;
    }

    if (!session?.user) {
      return false;
    }

    /* -----------------------------------------------------
     * CHECK BOOKING
     * --------------------------------------------------- */

    const {
      data:
        booking,
      error:
        bookingError,
    } =
      await supabase
        .from(
          'bookings'
        )
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

    if (
      bookingError
    ) {
      console.error(
        'CHECK REVIEW BOOKING ERROR:',
        bookingError
      );

      return false;
    }

    if (
      !booking
    ) {
      return false;
    }

    /*
     * ต้องเป็นเจ้าของ Booking
     * และ Booking ต้อง COMPLETED
     */

    if (
      booking.owner_id !==
        session.user.id ||
      booking.status !==
        'COMPLETED'
    ) {
      return false;
    }

    /* -----------------------------------------------------
     * CHECK EXISTING REVIEW
     * --------------------------------------------------- */

    const {
      data:
        existing,
      error:
        reviewError,
    } =
      await supabase
        .from(
          'reviews'
        )
        .select(
          'id'
        )
        .eq(
          'booking_id',
          bookingId
        )
        .maybeSingle();

    if (
      reviewError
    ) {
      console.error(
        'CHECK EXISTING REVIEW ERROR:',
        reviewError
      );

      return false;
    }

    /*
     * ถ้ายังไม่มี Review = รีวิวได้
     */

    return !existing;
  },

  /* =======================================================
   * CREATE REVIEW
   * ===================================================== */

  async createReview(
    input: CreateReviewInput
  ): Promise<Review> {
    /* -----------------------------------------------------
     * VALIDATE INPUT
     * --------------------------------------------------- */

    if (
      !input.bookingId
    ) {
      throw new Error(
        'ไม่พบข้อมูลการจอง'
      );
    }

    if (
      !input.sitterId
    ) {
      throw new Error(
        'ไม่พบข้อมูลผู้รับฝาก'
      );
    }

    if (
      !Number.isInteger(
        input.rating
      ) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      throw new Error(
        'กรุณาให้คะแนนตั้งแต่ 1 ถึง 5 ดาว'
      );
    }

    /* -----------------------------------------------------
     * SESSION
     * --------------------------------------------------- */

    const {
      data: {
        session,
      },
      error:
        sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError
    ) {
      console.error(
        'GET SESSION ERROR:',
        sessionError
      );

      throw new Error(
        'ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้'
      );
    }

    if (
      !session?.user
    ) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่'
      );
    }

    /* -----------------------------------------------------
     * LOAD BOOKING
     * --------------------------------------------------- */

    const {
      data:
        booking,
      error:
        bookingError,
    } =
      await supabase
        .from(
          'bookings'
        )
        .select(`
          id,
          owner_id,
          sitter_id,
          status
        `)
        .eq(
          'id',
          input.bookingId
        )
        .maybeSingle();

    if (
      bookingError
    ) {
      console.error(
        'GET BOOKING BEFORE REVIEW ERROR:',
        bookingError
      );

      throw new Error(
        bookingError.message ||
          'ไม่สามารถตรวจสอบข้อมูลการจองได้'
      );
    }

    if (
      !booking
    ) {
      throw new Error(
        'ไม่พบข้อมูลการจอง'
      );
    }

    /* -----------------------------------------------------
     * OWNER CHECK
     * --------------------------------------------------- */

    if (
      booking.owner_id !==
      session.user.id
    ) {
      throw new Error(
        'คุณไม่มีสิทธิ์รีวิวการจองนี้'
      );
    }

    /* -----------------------------------------------------
     * STATUS CHECK
     * --------------------------------------------------- */

    if (
      booking.status !==
      'COMPLETED'
    ) {
      throw new Error(
        'สามารถรีวิวได้หลังจากการให้บริการเสร็จสิ้นแล้วเท่านั้น'
      );
    }

    /* -----------------------------------------------------
     * SITTER CHECK
     * --------------------------------------------------- */

    if (
      booking.sitter_id !==
      input.sitterId
    ) {
      throw new Error(
        'ข้อมูลผู้รับฝากไม่ตรงกับการจอง'
      );
    }

    /* -----------------------------------------------------
     * DUPLICATE REVIEW CHECK
     * --------------------------------------------------- */

    const {
      data:
        existingReview,
      error:
        existingError,
    } =
      await supabase
        .from(
          'reviews'
        )
        .select(
          'id'
        )
        .eq(
          'booking_id',
          input.bookingId
        )
        .maybeSingle();

    if (
      existingError
    ) {
      console.error(
        'CHECK DUPLICATE REVIEW ERROR:',
        existingError
      );

      throw new Error(
        existingError.message ||
          'ไม่สามารถตรวจสอบรีวิวเดิมได้'
      );
    }

    if (
      existingReview
    ) {
      throw new Error(
        'คุณได้รีวิวการจองนี้แล้ว'
      );
    }

    /* -----------------------------------------------------
     * COMMENT
     * --------------------------------------------------- */

    const comment =
      input.comment
        ?.trim() ||
      null;

    /*
     * จำกัดข้อความเพื่อป้องกันข้อความยาวเกินไป
     */

    if (
      comment &&
      comment.length >
        1000
    ) {
      throw new Error(
        'ความคิดเห็นต้องไม่เกิน 1,000 ตัวอักษร'
      );
    }

    /* -----------------------------------------------------
     * INSERT
     * --------------------------------------------------- */

    const {
      data:
        review,
      error:
        insertError,
    } =
      await supabase
        .from(
          'reviews'
        )
        .insert({
          booking_id:
            input.bookingId,

          owner_id:
            session.user.id,

          sitter_id:
            input.sitterId,

          rating:
            input.rating,

          comment,
        })
        .select(
          '*'
        )
        .single();

    if (
      insertError
    ) {
      console.error(
        'CREATE REVIEW ERROR:',
        insertError
      );

      /*
       * PostgreSQL unique violation
       * ป้องกันกรณีกดส่งซ้ำพร้อมกัน
       */

      if (
        insertError.code ===
        '23505'
      ) {
        throw new Error(
          'คุณได้รีวิวการจองนี้แล้ว'
        );
      }

      throw new Error(
        insertError.message ||
          'ไม่สามารถส่งรีวิวได้'
      );
    }

    return mapReview(
      review as ReviewRow
    );
  },

  /* =======================================================
   * GET REVIEWS BY SITTER
   * ===================================================== */

  async getBySitterId(
    sitterId: string
  ): Promise<Review[]> {
    if (
      !sitterId
    ) {
      return [];
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'reviews'
        )
        .select(
          '*'
        )
        .eq(
          'sitter_id',
          sitterId
        )
        .order(
          'created_at',
          {
            ascending:
              false,
          }
        );

    if (
      error
    ) {
      console.error(
        'GET SITTER REVIEWS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดรีวิวของผู้รับฝากได้'
      );
    }

    return (
      (data ??
        []) as ReviewRow[]
    ).map(
      mapReview
    );
  },

  /* =======================================================
   * GET SITTER RATING SUMMARY
   * ===================================================== */

  async getSitterRatingSummary(
    sitterId: string
  ): Promise<SitterRatingSummary> {
    if (
      !sitterId
    ) {
      return {
        averageRating:
          0,

        reviewCount:
          0,
      };
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'reviews'
        )
        .select(
          'rating'
        )
        .eq(
          'sitter_id',
          sitterId
        );

    if (
      error
    ) {
      console.error(
        'GET SITTER RATING SUMMARY ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดคะแนนผู้รับฝากได้'
      );
    }

    const ratings =
      (
        data ??
        []
      )
        .map(
          (row) =>
            Number(
              row.rating
            )
        )
        .filter(
          (rating) =>
            Number.isFinite(
              rating
            )
        );

    if (
      ratings.length ===
      0
    ) {
      return {
        averageRating:
          0,

        reviewCount:
          0,
      };
    }

    const total =
      ratings.reduce(
        (
          sum,
          rating
        ) =>
          sum +
          rating,
        0
      );

    const average =
      total /
      ratings.length;

    return {
      averageRating:
        Math.round(
          average *
            10
        ) /
        10,

      reviewCount:
        ratings.length,
    };
  },
};