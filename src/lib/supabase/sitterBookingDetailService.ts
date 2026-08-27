import { supabase } from '@/lib/supabase/client';

export interface SitterBookingDisplay {
  id: string;
  bookingCode: string | null;

  ownerId: string;
  ownerName: string;
  ownerPhone: string | null;

  petId: string;
  petName: string;
  petPhotoUrl: string | null;
  petBreed: string | null;

  serviceId: string;
  serviceName: string;

  startDate: string;
  endDate: string;

  dailyRate: number | null;
  totalPrice: number;

  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';

  ownerNote: string | null;
  sitterNote: string | null;
  rejectionReason: string | null;

  createdAt: string;
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

  status: string;

  owner_phone: string | null;

  owner_note: string | null;
  sitter_note: string | null;
  rejection_reason: string | null;

  created_at: string;
}

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
}

interface PetRow {
  id: string;
  name: string;
  breed: string | null;
  photo_url: string | null;
}

interface ServiceRow {
  id: string;
  service_name: string;
}

export const SitterBookingDetailService = {
  async getBookings(
    sitterProfileId: string
  ): Promise<SitterBookingDisplay[]> {
    if (!sitterProfileId) {
      return [];
    }

    const { data: bookingData, error: bookingError } =
      await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          owner_id,
          sitter_id,
          pet_id,
          service_id,
          start_date,
          end_date,
          daily_rate,
          total_price,
          status,
          owner_phone,
          owner_note,
          sitter_note,
          rejection_reason,
          created_at
        `)
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

    if (bookingError) {
      console.error(
        'GET SITTER BOOKING DETAIL ERROR:',
        bookingError
      );

      throw new Error(
        bookingError.message ||
          'ไม่สามารถโหลดคำขอจองได้'
      );
    }

    const bookings =
      (bookingData ?? []) as BookingRow[];

    if (bookings.length === 0) {
      return [];
    }

    const ownerIds =
      Array.from(
        new Set(
          bookings.map(
            (item) => item.owner_id
          )
        )
      );

    const petIds =
      Array.from(
        new Set(
          bookings.map(
            (item) => item.pet_id
          )
        )
      );

    const serviceIds =
      Array.from(
        new Set(
          bookings.map(
            (item) => item.service_id
          )
        )
      );

    const [
      profilesResult,
      petsResult,
      servicesResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          display_name
        `)
        .in('id', ownerIds),

      supabase
        .from('pets')
        .select(`
          id,
          name,
          breed,
          photo_url
        `)
        .in('id', petIds),

      supabase
        .from('sitter_services')
        .select(`
          id,
          service_name
        `)
        .in('id', serviceIds),
    ]);

    if (profilesResult.error) {
      throw new Error(
        profilesResult.error.message
      );
    }

    if (petsResult.error) {
      throw new Error(
        petsResult.error.message
      );
    }

    if (servicesResult.error) {
      throw new Error(
        servicesResult.error.message
      );
    }

    const profiles =
      (profilesResult.data ??
        []) as ProfileRow[];

    const pets =
      (petsResult.data ??
        []) as PetRow[];

    const services =
      (servicesResult.data ??
        []) as ServiceRow[];

    return bookings.map(
      (booking) => {
        const owner =
          profiles.find(
            (item) =>
              item.id ===
              booking.owner_id
          );

        const pet =
          pets.find(
            (item) =>
              item.id ===
              booking.pet_id
          );

        const service =
          services.find(
            (item) =>
              item.id ===
              booking.service_id
          );

        const fullName =
          `${owner?.first_name ?? ''} ${
            owner?.last_name ?? ''
          }`.trim();

        return {
          id:
            booking.id,

          bookingCode:
            booking.booking_code,

          ownerId:
            booking.owner_id,

          ownerName:
            owner?.display_name ||
            fullName ||
            'เจ้าของสัตว์เลี้ยง',

          ownerPhone:
            booking.owner_phone,

          petId:
            booking.pet_id,

          petName:
            pet?.name ||
            'สัตว์เลี้ยง',

          petPhotoUrl:
            pet?.photo_url ||
            null,

          petBreed:
            pet?.breed ||
            null,

          serviceId:
            booking.service_id,

          serviceName:
            service?.service_name ||
            'บริการรับฝาก',

          startDate:
            booking.start_date,

          endDate:
            booking.end_date,

          dailyRate:
            booking.daily_rate !==
            null
              ? Number(
                  booking.daily_rate
                )
              : null,

          totalPrice:
            Number(
              booking.total_price
            ),

          status:
            booking.status as SitterBookingDisplay['status'],

          ownerNote:
            booking.owner_note,

          sitterNote:
            booking.sitter_note,

          rejectionReason:
            booking.rejection_reason,

          createdAt:
            booking.created_at,
        };
      }
    );
  },
};