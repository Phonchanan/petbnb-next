import { supabase } from '@/lib/supabase/client';

export interface BookingOwnerDetail {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
}

export interface BookingPetDetail {
  id: string;
  name: string;
  categoryId: string;
  breed: string | null;
  gender: string | null;
  birthDate: string | null;
  ageYears: number | null;
  weight: number | null;
  photoUrl: string | null;

  foodInfo: string | null;
  feedingSchedule: string | null;

  allergies: string | null;
  medicalConditions: string | null;
  medication: string | null;

  specialNeeds: string | null;
  behaviorNotes: string | null;

  isVaccinated: boolean | null;
  isSpayed: boolean | null;

  emergencyContact: string | null;
}

export interface BookingServiceDetail {
  id: string;
  serviceName: string;
  description: string | null;
  price: number;
  priceUnit: string;
  categoryId: string;
}

export interface SitterBookingDetail {
  id: string;
  bookingCode: string | null;

  ownerId: string;
  sitterId: string;
  petId: string;
  serviceId: string;

  startDate: string;
  endDate: string;

  dailyRate: number;
  totalPrice: number;

  status: string;

  ownerNote: string | null;
  sitterNote: string | null;
  rejectionReason: string | null;

  ownerPhone: string | null;
  petCount: number;

  createdAt: string;

  owner: BookingOwnerDetail;
  pet: BookingPetDetail;
  service: BookingServiceDetail;
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

  daily_rate: number | string | null;
  total_price: number | string;

  status: string;

  owner_note: string | null;
  sitter_note: string | null;
  rejection_reason: string | null;

  owner_phone: string | null;
  pet_count: number | null;

  created_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface PetRow {
  id: string;
  owner_id: string;

  name: string;
  category_id: string;

  breed: string | null;
  gender: string | null;

  birth_date: string | null;
  age_years: number | null;

  weight: number | string | null;

  photo_url: string | null;

  food_info: string | null;
  feeding_schedule: string | null;

  allergies: string | null;
  medical_conditions: string | null;
  medication: string | null;

  special_needs: string | null;
  behavior_notes: string | null;

  is_vaccinated: boolean | null;
  is_spayed: boolean | null;

  emergency_contact: string | null;
}

interface ServiceRow {
  id: string;
  sitter_id: string;
  service_name: string;
  description: string | null;
  price: number | string;
  price_unit: string;
  category_id: string;
}

function isValidUuid(
  value: string | null | undefined
) {
  if (!value) {
    return false;
  }

  const clean =
    value.trim();

  if (!clean) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    clean
  );
}

function getDisplayName(
  profile: ProfileRow
) {
  if (
    profile.display_name?.trim()
  ) {
    return profile.display_name.trim();
  }

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    fullName ||
    'เจ้าของสัตว์เลี้ยง'
  );
}

export const SitterBookingDetailService = {
  async getById(
    bookingId: string,
    sitterProfileId: string
  ): Promise<SitterBookingDetail | null> {
    const cleanBookingId =
      bookingId?.trim();

    const cleanSitterProfileId =
      sitterProfileId?.trim();

    console.log(
      'SITTER BOOKING DETAIL DEBUG:',
      {
        bookingId:
          cleanBookingId,
        sitterProfileId:
          cleanSitterProfileId,
      }
    );

    if (
      !isValidUuid(
        cleanBookingId
      )
    ) {
      throw new Error(
        'Booking ID ไม่ถูกต้อง'
      );
    }

    if (
      !isValidUuid(
        cleanSitterProfileId
      )
    ) {
      throw new Error(
        'Sitter Profile ID ไม่ถูกต้อง'
      );
    }

    const {
      data: bookingData,
      error: bookingError,
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
        daily_rate,
        total_price,
        status,
        owner_note,
        sitter_note,
        rejection_reason,
        owner_phone,
        pet_count,
        created_at
      `)
      .eq(
        'id',
        cleanBookingId
      )
      .eq(
        'sitter_id',
        cleanSitterProfileId
      )
      .maybeSingle();

    if (
      bookingError
    ) {
      console.error(
        'GET SITTER BOOKING ERROR:',
        bookingError
      );

      throw new Error(
        bookingError.message
      );
    }

    if (
      !bookingData
    ) {
      return null;
    }

    const booking =
      bookingData as BookingRow;

    if (
      !isValidUuid(
        booking.owner_id
      )
    ) {
      throw new Error(
        'Owner ID ในการจองไม่ถูกต้อง'
      );
    }

    if (
      !isValidUuid(
        booking.pet_id
      )
    ) {
      throw new Error(
        'Pet ID ในการจองไม่ถูกต้อง'
      );
    }

    if (
      !isValidUuid(
        booking.service_id
      )
    ) {
      throw new Error(
        'Service ID ในการจองไม่ถูกต้อง'
      );
    }

    if (
      !isValidUuid(
        booking.sitter_id
      )
    ) {
      throw new Error(
        'Sitter ID ในการจองไม่ถูกต้อง'
      );
    }

    const [
      ownerResult,
      petResult,
      serviceResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          first_name,
          last_name,
          avatar_url,
          phone
        `)
        .eq(
          'id',
          booking.owner_id
        )
        .maybeSingle(),

      supabase
        .from('pets')
        .select(`
          id,
          owner_id,
          name,
          category_id,
          breed,
          gender,
          birth_date,
          age_years,
          weight,
          photo_url,
          food_info,
          feeding_schedule,
          allergies,
          medical_conditions,
          medication,
          special_needs,
          behavior_notes,
          is_vaccinated,
          is_spayed,
          emergency_contact
        `)
        .eq(
          'id',
          booking.pet_id
        )
        .maybeSingle(),

      supabase
        .from(
          'sitter_services'
        )
        .select(`
          id,
          sitter_id,
          service_name,
          description,
          price,
          price_unit,
          category_id
        `)
        .eq(
          'id',
          booking.service_id
        )
        .maybeSingle(),
    ]);

    if (
      ownerResult.error
    ) {
      console.error(
        'OWNER DETAIL ERROR:',
        ownerResult.error
      );

      throw new Error(
        ownerResult.error.message
      );
    }

    if (
      petResult.error
    ) {
      console.error(
        'PET DETAIL ERROR:',
        petResult.error
      );

      throw new Error(
        petResult.error.message
      );
    }

    if (
      serviceResult.error
    ) {
      console.error(
        'SERVICE DETAIL ERROR:',
        serviceResult.error
      );

      throw new Error(
        serviceResult.error.message
      );
    }

    if (
      !ownerResult.data
    ) {
      throw new Error(
        'ไม่พบข้อมูลเจ้าของสัตว์เลี้ยง'
      );
    }

    if (
      !petResult.data
    ) {
      throw new Error(
        'ไม่พบข้อมูลสัตว์เลี้ยง'
      );
    }

    if (
      !serviceResult.data
    ) {
      throw new Error(
        'ไม่พบข้อมูลบริการ'
      );
    }

    const owner =
      ownerResult.data as ProfileRow;

    const pet =
      petResult.data as PetRow;

    const service =
      serviceResult.data as ServiceRow;

    if (
      pet.owner_id !==
      booking.owner_id
    ) {
      throw new Error(
        'ข้อมูลเจ้าของสัตว์เลี้ยงไม่ตรงกับการจอง'
      );
    }

    if (
      service.sitter_id !==
      booking.sitter_id
    ) {
      throw new Error(
        'ข้อมูลบริการไม่ตรงกับการจอง'
      );
    }

    return {
      id:
        booking.id,

      bookingCode:
        booking.booking_code,

      ownerId:
        booking.owner_id,

      sitterId:
        booking.sitter_id,

      petId:
        booking.pet_id,

      serviceId:
        booking.service_id,

      startDate:
        booking.start_date,

      endDate:
        booking.end_date,

      dailyRate:
        Number(
          booking.daily_rate ??
            service.price
        ),

      totalPrice:
        Number(
          booking.total_price
        ),

      status:
        booking.status,

      ownerNote:
        booking.owner_note,

      sitterNote:
        booking.sitter_note,

      rejectionReason:
        booking.rejection_reason,

      ownerPhone:
        booking.owner_phone,

      petCount:
        booking.pet_count ??
        1,

      createdAt:
        booking.created_at,

      owner: {
        id:
          owner.id,

        displayName:
          getDisplayName(
            owner
          ),

        avatarUrl:
          owner.avatar_url,

        phone:
          booking.owner_phone ||
          owner.phone ||
          null,
      },

      pet: {
        id:
          pet.id,

        name:
          pet.name,

        categoryId:
          pet.category_id,

        breed:
          pet.breed,

        gender:
          pet.gender,

        birthDate:
          pet.birth_date,

        ageYears:
          pet.age_years,

        weight:
          pet.weight !== null
            ? Number(
                pet.weight
              )
            : null,

        photoUrl:
          pet.photo_url,

        foodInfo:
          pet.food_info,

        feedingSchedule:
          pet.feeding_schedule,

        allergies:
          pet.allergies,

        medicalConditions:
          pet.medical_conditions,

        medication:
          pet.medication,

        specialNeeds:
          pet.special_needs,

        behaviorNotes:
          pet.behavior_notes,

        isVaccinated:
          pet.is_vaccinated,

        isSpayed:
          pet.is_spayed,

        emergencyContact:
          pet.emergency_contact,
      },

      service: {
        id:
          service.id,

        serviceName:
          service.service_name,

        description:
          service.description,

        price:
          Number(
            service.price
          ),

        priceUnit:
          service.price_unit,

        categoryId:
          service.category_id,
      },
    };
  },
};