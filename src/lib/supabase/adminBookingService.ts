import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * TYPES
 * ======================================================= */

export type AdminBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface AdminBookingListItem {
  id: string;
  bookingCode: string | null;

  ownerId: string;
  sitterId: string;
  petId: string;
  serviceId: string;

  ownerName: string;
  sitterName: string;
  petName: string;
  serviceName: string;

  startDate: string;
  endDate: string;

  totalPrice: number;
  dailyRate: number | null;
  petCount: number | null;

  status: AdminBookingStatus;

  ownerPhone: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AdminBookingDetail
  extends AdminBookingListItem {
  ownerNote: string | null;
  sitterNote: string | null;
  rejectionReason: string | null;

  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;

  addOns: unknown;

  petCategoryId: string;
  petBreed: string | null;
  petGender: string | null;
  petPhotoUrl: string | null;

  petFoodInfo: string | null;
  petFeedingSchedule: string | null;
  petAllergies: string | null;
  petMedicalConditions: string | null;
  petMedication: string | null;
  petBehaviorNotes: string | null;
  petSpecialNeeds: string | null;

  serviceCategoryId: string;
  servicePrice: number;
  servicePriceUnit: string;
}

/* =========================================================
 * SUPABASE TYPES
 * ======================================================= */

interface ProfileRelation {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
}

interface SitterProfileRelation {
  id: string;
  user_id: string;

  profiles:
    | ProfileRelation
    | ProfileRelation[]
    | null;
}

interface PetRelation {
  id: string;
  name: string;
  category_id: string;

  breed: string | null;
  gender: string | null;
  photo_url: string | null;

  food_info: string | null;
  feeding_schedule: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  medication: string | null;
  behavior_notes: string | null;
  special_needs: string | null;
}

interface ServiceRelation {
  id: string;
  category_id: string;
  service_name: string;
  price: number | string;
  price_unit: string;
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

  total_price: number | string;
  daily_rate: number | string | null;
  pet_count: number | null;

  status: string;

  owner_phone: string | null;

  owner_note: string | null;
  sitter_note: string | null;
  rejection_reason: string | null;

  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  add_ons: unknown;

  created_at: string;
  updated_at: string;

  owner:
    | ProfileRelation
    | ProfileRelation[]
    | null;

  sitter:
    | SitterProfileRelation
    | SitterProfileRelation[]
    | null;

  pet:
    | PetRelation
    | PetRelation[]
    | null;

  service:
    | ServiceRelation
    | ServiceRelation[]
    | null;
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function getSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getName(
  profile: ProfileRelation | null
): string {
  if (!profile) {
    return 'ไม่ระบุชื่อ';
  }

  if (profile.display_name?.trim()) {
    return profile.display_name.trim();
  }

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || 'ไม่ระบุชื่อ';
}

function normalizeStatus(
  status: string
): AdminBookingStatus {
  const value =
    status.toUpperCase();

  if (value === 'CONFIRMED') {
    return 'CONFIRMED';
  }

  if (value === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }

  if (value === 'COMPLETED') {
    return 'COMPLETED';
  }

  if (value === 'CANCELLED') {
    return 'CANCELLED';
  }

  if (value === 'REJECTED') {
    return 'REJECTED';
  }

  return 'PENDING';
}

function mapBookingRow(
  row: BookingRow
): AdminBookingDetail {
  const owner =
    getSingleRelation(row.owner);

  const sitterRelation =
    getSingleRelation(row.sitter);

  const sitterProfile =
    sitterRelation
      ? getSingleRelation(
          sitterRelation.profiles
        )
      : null;

  const pet =
    getSingleRelation(row.pet);

  const service =
    getSingleRelation(row.service);

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

    ownerName:
      getName(owner),

    sitterName:
      getName(
        sitterProfile
      ),

    petName:
      pet?.name ??
      'ไม่ระบุชื่อสัตว์',

    serviceName:
      service?.service_name ??
      'ไม่ระบุบริการ',

    startDate:
      row.start_date,

    endDate:
      row.end_date,

    totalPrice:
      Number(
        row.total_price
      ),

    dailyRate:
      row.daily_rate ===
      null
        ? null
        : Number(
            row.daily_rate
          ),

    petCount:
      row.pet_count,

    status:
      normalizeStatus(
        row.status
      ),

    ownerPhone:
      row.owner_phone,

    ownerNote:
      row.owner_note,

    sitterNote:
      row.sitter_note,

    rejectionReason:
      row.rejection_reason,

    confirmedAt:
      row.confirmed_at,

    startedAt:
      row.started_at,

    completedAt:
      row.completed_at,

    addOns:
      row.add_ons,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    petCategoryId:
      pet?.category_id ??
      '',

    petBreed:
      pet?.breed ??
      null,

    petGender:
      pet?.gender ??
      null,

    petPhotoUrl:
      pet?.photo_url ??
      null,

    petFoodInfo:
      pet?.food_info ??
      null,

    petFeedingSchedule:
      pet
        ?.feeding_schedule ??
      null,

    petAllergies:
      pet?.allergies ??
      null,

    petMedicalConditions:
      pet
        ?.medical_conditions ??
      null,

    petMedication:
      pet?.medication ??
      null,

    petBehaviorNotes:
      pet
        ?.behavior_notes ??
      null,

    petSpecialNeeds:
      pet
        ?.special_needs ??
      null,

    serviceCategoryId:
      service?.category_id ??
      '',

    servicePrice:
      service
        ? Number(
            service.price
          )
        : 0,

    servicePriceUnit:
      service?.price_unit ??
      '-',
  };
}

/* =========================================================
 * SERVICE
 * ======================================================= */

export const AdminBookingService = {
  /* =======================================================
   * GET ALL BOOKINGS
   * ===================================================== */

  async getBookings(): Promise<
    AdminBookingListItem[]
  > {
    const {
      data,
      error,
    } = await supabase
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

        total_price,
        daily_rate,
        pet_count,

        status,
        owner_phone,

        owner_note,
        sitter_note,
        rejection_reason,

        confirmed_at,
        started_at,
        completed_at,

        add_ons,

        created_at,
        updated_at,

        owner:profiles!bookings_owner_id_fkey (
          first_name,
          last_name,
          display_name
        ),

        sitter:sitter_profiles!bookings_sitter_id_fkey (
          id,
          user_id,

          profiles (
            first_name,
            last_name,
            display_name
          )
        ),

        pet:pets!bookings_pet_id_fkey (
          id,
          name,
          category_id,
          breed,
          gender,
          photo_url,
          food_info,
          feeding_schedule,
          allergies,
          medical_conditions,
          medication,
          behavior_notes,
          special_needs
        ),

        service:sitter_services!bookings_service_id_fkey (
          id,
          category_id,
          service_name,
          price,
          price_unit
        )
      `)
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'GET ADMIN BOOKINGS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลการจองได้'
      );
    }

    const rows =
      (data ??
        []) as unknown as BookingRow[];

    return rows.map(
      (
        row
      ): AdminBookingListItem => {
        const detail =
          mapBookingRow(row);

        return {
          id:
            detail.id,

          bookingCode:
            detail.bookingCode,

          ownerId:
            detail.ownerId,

          sitterId:
            detail.sitterId,

          petId:
            detail.petId,

          serviceId:
            detail.serviceId,

          ownerName:
            detail.ownerName,

          sitterName:
            detail.sitterName,

          petName:
            detail.petName,

          serviceName:
            detail.serviceName,

          startDate:
            detail.startDate,

          endDate:
            detail.endDate,

          totalPrice:
            detail.totalPrice,

          dailyRate:
            detail.dailyRate,

          petCount:
            detail.petCount,

          status:
            detail.status,

          ownerPhone:
            detail.ownerPhone,

          createdAt:
            detail.createdAt,

          updatedAt:
            detail.updatedAt,
        };
      }
    );
  },

  /* =======================================================
   * GET BOOKING DETAIL
   * ===================================================== */

  async getBookingById(
    bookingId: string
  ): Promise<AdminBookingDetail | null> {
    if (!bookingId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
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

        total_price,
        daily_rate,
        pet_count,

        status,
        owner_phone,

        owner_note,
        sitter_note,
        rejection_reason,

        confirmed_at,
        started_at,
        completed_at,

        add_ons,

        created_at,
        updated_at,

        owner:profiles!bookings_owner_id_fkey (
          first_name,
          last_name,
          display_name
        ),

        sitter:sitter_profiles!bookings_sitter_id_fkey (
          id,
          user_id,

          profiles (
            first_name,
            last_name,
            display_name
          )
        ),

        pet:pets!bookings_pet_id_fkey (
          id,
          name,
          category_id,
          breed,
          gender,
          photo_url,
          food_info,
          feeding_schedule,
          allergies,
          medical_conditions,
          medication,
          behavior_notes,
          special_needs
        ),

        service:sitter_services!bookings_service_id_fkey (
          id,
          category_id,
          service_name,
          price,
          price_unit
        )
      `)
      .eq(
        'id',
        bookingId
      )
      .maybeSingle();

    if (error) {
      console.error(
        'GET ADMIN BOOKING DETAIL ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดรายละเอียดการจองได้'
      );
    }

    if (!data) {
      return null;
    }

    return mapBookingRow(
      data as unknown as BookingRow
    );
  },
};