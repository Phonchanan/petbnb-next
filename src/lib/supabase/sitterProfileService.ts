import { supabase } from '@/lib/supabase/client';

export interface LocationOption {
  id: string;
  province: string;
  district: string;
  area: string;
}

export interface SitterProfileData {
  id: string;
  userId: string;
  locationId: string;

  houseType: string | null;
  specialty: string | null;

  experienceYears: number;
  startingPrice: number;

  isVerified: boolean;
  isAvailable: boolean;

  verificationStatus: string;

  createdAt: string;
  updatedAt: string;
}

export interface SitterProfileInput {
  locationId: string;

  houseType?: string;
  specialty?: string;

  experienceYears: number;
  startingPrice: number;

  isAvailable: boolean;
}

interface SitterProfileRow {
  id: string;
  user_id: string;
  location_id: string;

  house_type: string | null;
  specialty: string | null;

  experience_years: number;

  starting_price:
    | number
    | string;

  is_verified: boolean;
  is_available: boolean;

  verification_status: string;

  created_at: string;
  updated_at: string;
}

interface LocationRow {
  id: string;
  province: string;
  district: string;
  area: string;
}

function mapSitterProfile(
  row: SitterProfileRow
): SitterProfileData {
  return {
    id: row.id,

    userId:
      row.user_id,

    locationId:
      row.location_id,

    houseType:
      row.house_type,

    specialty:
      row.specialty,

    experienceYears:
      row.experience_years,

    startingPrice:
      Number(
        row.starting_price
      ),

    isVerified:
      row.is_verified,

    isAvailable:
      row.is_available,

    verificationStatus:
      row.verification_status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

export const SitterProfileService = {
  async getByUserId(
    userId: string
  ): Promise<SitterProfileData | null> {
    if (!userId) {
      return null;
    }

    const { data, error } =
      await supabase
        .from('sitter_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
      console.error(
        'GET SITTER PROFILE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดโปรไฟล์ผู้รับฝากได้'
      );
    }

    if (!data) {
      return null;
    }

    return mapSitterProfile(
      data as SitterProfileRow
    );
  },

  async getLocations(): Promise<LocationOption[]> {
    const { data, error } =
      await supabase
        .from('locations')
        .select(`
          id,
          province,
          district,
          area
        `)
        .eq('is_active', true)
        .order(
          'province',
          {
            ascending: true,
          }
        );

    if (error) {
      console.error(
        'GET LOCATIONS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลพื้นที่ได้'
      );
    }

    return (
      (data ?? []) as LocationRow[]
    ).map(
      (location) => ({
        id: location.id,

        province:
          location.province,

        district:
          location.district,

        area:
          location.area,
      })
    );
  },

  async createProfile(
    userId: string,
    input: SitterProfileInput
  ): Promise<SitterProfileData> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่'
      );
    }

    if (
      session.user.id !== userId
    ) {
      throw new Error(
        'บัญชีผู้ใช้ไม่ตรงกับโปรไฟล์ผู้รับฝาก'
      );
    }

    const payload = {
      user_id:
        userId,

      location_id:
        input.locationId,

      house_type:
        input.houseType?.trim() ||
        null,

      specialty:
        input.specialty?.trim() ||
        null,

      experience_years:
        input.experienceYears,

      starting_price:
        input.startingPrice,

      is_available:
        input.isAvailable,

      is_verified: false,

      verification_status:
        'PENDING',

      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabase
        .from('sitter_profiles')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
      console.error(
        'CREATE SITTER PROFILE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถสร้างโปรไฟล์ผู้รับฝากได้'
      );
    }

    return mapSitterProfile(
      data as SitterProfileRow
    );
  },

  async updateProfile(
    profileId: string,
    input: SitterProfileInput
  ): Promise<SitterProfileData> {
    const payload = {
      location_id:
        input.locationId,

      house_type:
        input.houseType?.trim() ||
        null,

      specialty:
        input.specialty?.trim() ||
        null,

      experience_years:
        input.experienceYears,

      starting_price:
        input.startingPrice,

      is_available:
        input.isAvailable,

      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabase
        .from('sitter_profiles')
        .update(payload)
        .eq('id', profileId)
        .select('*')
        .single();

    if (error) {
      console.error(
        'UPDATE SITTER PROFILE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถแก้ไขโปรไฟล์ผู้รับฝากได้'
      );
    }

    return mapSitterProfile(
      data as SitterProfileRow
    );
  },
};