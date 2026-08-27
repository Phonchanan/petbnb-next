import { supabase } from '@/lib/supabase/client';

export type PetCategoryId =
  | 'SMALL_MAMMALS'
  | 'CANINE_FELINE'
  | 'REPTILES_AMPHIBIANS_AQUATICS'
  | 'ORNAMENTAL_BIRDS_AVIANS';

export type PetGender =
  | 'MALE'
  | 'FEMALE'
  | 'UNKNOWN';

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  categoryId: PetCategoryId;

  breed: string | null;
  gender: PetGender;

  ageYears: number | null;
  weightKg: number | null;

  description: string | null;
  photoUrl: string | null;

  specialNeeds: string | null;

  foodInfo: string | null;
  feedingSchedule: string | null;

  allergies: string | null;
  medicalConditions: string | null;
  medication: string | null;

  behaviorNotes: string | null;
  emergencyContact: string | null;

  isVaccinated: boolean | null;
  isSpayed: boolean | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface PetInput {
  ownerId: string;
  name: string;
  categoryId: PetCategoryId;

  breed?: string;
  gender?: PetGender;

  ageYears?: number | null;
  weightKg?: number | null;

  description?: string;
  photoUrl?: string;

  specialNeeds?: string;

  foodInfo?: string;
  feedingSchedule?: string;

  allergies?: string;
  medicalConditions?: string;
  medication?: string;

  behaviorNotes?: string;
  emergencyContact?: string;

  isVaccinated?: boolean;
  isSpayed?: boolean;
}

interface PetRow {
  id: string;
  owner_id: string;
  name: string;
  category_id: string;

  breed: string | null;
  gender: string | null;

  age_years: number | null;

  weight:
    | number
    | string
    | null;

  description: string | null;
  photo_url: string | null;

  special_needs: string | null;

  food_info: string | null;
  feeding_schedule: string | null;

  allergies: string | null;
  medical_conditions: string | null;
  medication: string | null;

  behavior_notes: string | null;

  emergency_contact: string | null;

  is_vaccinated: boolean | null;
  is_spayed: boolean | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

interface PetInsertPayload {
  owner_id: string;
  name: string;
  category_id: PetCategoryId;

  breed: string | null;
  gender: PetGender;

  age_years: number | null;
  weight: number | null;

  description: string | null;
  photo_url: string | null;

  special_needs: string | null;

  food_info: string | null;
  feeding_schedule: string | null;

  allergies: string | null;
  medical_conditions: string | null;
  medication: string | null;

  behavior_notes: string | null;

  emergency_contact: string | null;

  is_vaccinated: boolean;
  is_spayed: boolean;

  is_active: boolean;
}

interface PetUpdatePayload {
  name?: string;
  category_id?: PetCategoryId;

  breed?: string | null;
  gender?: PetGender;

  age_years?: number | null;
  weight?: number | null;

  description?: string | null;
  photo_url?: string | null;

  special_needs?: string | null;

  food_info?: string | null;
  feeding_schedule?: string | null;

  allergies?: string | null;
  medical_conditions?: string | null;
  medication?: string | null;

  behavior_notes?: string | null;

  emergency_contact?: string | null;

  is_vaccinated?: boolean;
  is_spayed?: boolean;

  is_active?: boolean;

  updated_at?: string;
}

function mapPet(row: PetRow): Pet {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,

    categoryId:
      row.category_id as PetCategoryId,

    breed: row.breed,

    gender:
      row.gender === 'MALE' ||
      row.gender === 'FEMALE'
        ? row.gender
        : 'UNKNOWN',

    ageYears:
      row.age_years,

    weightKg:
      row.weight !== null
        ? Number(row.weight)
        : null,

    description:
      row.description,

    photoUrl:
      row.photo_url,

    specialNeeds:
      row.special_needs,

    foodInfo:
      row.food_info,

    feedingSchedule:
      row.feeding_schedule,

    allergies:
      row.allergies,

    medicalConditions:
      row.medical_conditions,

    medication:
      row.medication,

    behaviorNotes:
      row.behavior_notes,

    emergencyContact:
      row.emergency_contact,

    isVaccinated:
      row.is_vaccinated,

    isSpayed:
      row.is_spayed,

    isActive:
      row.is_active,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function createInsertPayload(
  input: PetInput
): PetInsertPayload {
  return {
    owner_id:
      input.ownerId,

    name:
      input.name.trim(),

    category_id:
      input.categoryId,

    breed:
      input.breed?.trim() || null,

    gender:
      input.gender ?? 'UNKNOWN',

    age_years:
      input.ageYears ?? null,

    weight:
      input.weightKg ?? null,

    description:
      input.description?.trim() || null,

    photo_url:
      input.photoUrl?.trim() || null,

    special_needs:
      input.specialNeeds?.trim() || null,

    food_info:
      input.foodInfo?.trim() || null,

    feeding_schedule:
      input.feedingSchedule?.trim() || null,

    allergies:
      input.allergies?.trim() || null,

    medical_conditions:
      input.medicalConditions?.trim() || null,

    medication:
      input.medication?.trim() || null,

    behavior_notes:
      input.behaviorNotes?.trim() || null,

    emergency_contact:
      input.emergencyContact?.trim() || null,

    is_vaccinated:
      input.isVaccinated ?? false,

    is_spayed:
      input.isSpayed ?? false,

    is_active: true,
  };
}

function createUpdatePayload(
  input: Partial<PetInput>
): PetUpdatePayload {
  const payload: PetUpdatePayload = {
    updated_at:
      new Date().toISOString(),
  };

  if (input.name !== undefined) {
    payload.name =
      input.name.trim();
  }

  if (input.categoryId !== undefined) {
    payload.category_id =
      input.categoryId;
  }

  if (input.breed !== undefined) {
    payload.breed =
      input.breed.trim() || null;
  }

  if (input.gender !== undefined) {
    payload.gender =
      input.gender;
  }

  if (input.ageYears !== undefined) {
    payload.age_years =
      input.ageYears ?? null;
  }

  if (input.weightKg !== undefined) {
    payload.weight =
      input.weightKg ?? null;
  }

  if (input.description !== undefined) {
    payload.description =
      input.description.trim() || null;
  }

  if (input.photoUrl !== undefined) {
    payload.photo_url =
      input.photoUrl.trim() || null;
  }

  if (input.specialNeeds !== undefined) {
    payload.special_needs =
      input.specialNeeds.trim() || null;
  }

  if (input.foodInfo !== undefined) {
    payload.food_info =
      input.foodInfo.trim() || null;
  }

  if (input.feedingSchedule !== undefined) {
    payload.feeding_schedule =
      input.feedingSchedule.trim() || null;
  }

  if (input.allergies !== undefined) {
    payload.allergies =
      input.allergies.trim() || null;
  }

  if (input.medicalConditions !== undefined) {
    payload.medical_conditions =
      input.medicalConditions.trim() || null;
  }

  if (input.medication !== undefined) {
    payload.medication =
      input.medication.trim() || null;
  }

  if (input.behaviorNotes !== undefined) {
    payload.behavior_notes =
      input.behaviorNotes.trim() || null;
  }

  if (input.emergencyContact !== undefined) {
    payload.emergency_contact =
      input.emergencyContact.trim() || null;
  }

  if (input.isVaccinated !== undefined) {
    payload.is_vaccinated =
      input.isVaccinated;
  }

  if (input.isSpayed !== undefined) {
    payload.is_spayed =
      input.isSpayed;
  }

  return payload;
}

function validateImage(file: File) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP'
    );
  }

  const maxSize =
    5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(
      'รูปภาพต้องมีขนาดไม่เกิน 5 MB'
    );
  }
}

function getFileExtension(
  file: File
): string {
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase();

  if (extension) {
    return extension;
  }

  if (file.type === 'image/png') {
    return 'png';
  }

  if (file.type === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
}

export const PetService = {
  async getPetsByOwner(
    ownerId: string
  ): Promise<Pet[]> {
    if (!ownerId) {
      return [];
    }

    const { data, error } =
      await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        'GET PETS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้'
      );
    }

    const rows =
      (data ?? []) as PetRow[];

    return rows.map(mapPet);
  },

  async getPetById(
    petId: string
  ): Promise<Pet | null> {
    if (!petId) {
      return null;
    }

    const { data, error } =
      await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
      console.error(
        'GET PET ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้'
      );
    }

    if (!data) {
      return null;
    }

    return mapPet(
      data as PetRow
    );
  },

  async uploadPetImage(
    ownerId: string,
    file: File
  ): Promise<string> {
    if (!ownerId) {
      throw new Error(
        'ไม่พบข้อมูลเจ้าของสัตว์เลี้ยง'
      );
    }

    /**
     * ตรวจ session ก่อน upload
     */
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
        'กรุณาเข้าสู่ระบบใหม่ก่อนอัปโหลดรูปสัตว์เลี้ยง'
      );
    }

    /**
     * ต้องเป็น owner คนเดียวกับ session
     */
    if (
      session.user.id !== ownerId
    ) {
      console.error(
        'OWNER ID:',
        ownerId
      );

      console.error(
        'AUTH USER ID:',
        session.user.id
      );

      throw new Error(
        'บัญชีผู้ใช้ไม่ตรงกับเจ้าของสัตว์เลี้ยง'
      );
    }

    validateImage(file);

    const extension =
      getFileExtension(file);

    /**
     * สำคัญ:
     * folder แรกใช้ auth user id
     *
     * เช่น:
     * uuid/abc.jpg
     */
    const filePath =
      `${session.user.id}/${crypto.randomUUID()}.${extension}`;

    console.log(
      'UPLOAD PET IMAGE PATH:',
      filePath
    );

    const {
      data: uploadData,
      error: uploadError,
    } = await supabase.storage
      .from('pet-images')
      .upload(
        filePath,
        file,
        {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        }
      );

    if (uploadError) {
      console.error(
        'UPLOAD PET IMAGE ERROR:',
        uploadError
      );

      throw new Error(
        `ไม่สามารถอัปโหลดรูปสัตว์เลี้ยงได้: ${uploadError.message}`
      );
    }

    console.log(
      'UPLOAD PET IMAGE SUCCESS:',
      uploadData
    );

    const {
      data: publicUrlData,
    } = supabase.storage
      .from('pet-images')
      .getPublicUrl(filePath);

    if (
      !publicUrlData.publicUrl
    ) {
      throw new Error(
        'ไม่สามารถสร้าง URL ของรูปสัตว์เลี้ยงได้'
      );
    }

    return publicUrlData.publicUrl;
  },

  async createPet(
    input: PetInput
  ): Promise<Pet> {
    const payload =
      createInsertPayload(input);

    const { data, error } =
      await supabase
        .from('pets')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
      console.error(
        'CREATE PET ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถเพิ่มข้อมูลสัตว์เลี้ยงได้'
      );
    }

    return mapPet(
      data as PetRow
    );
  },

  async updatePet(
    petId: string,
    input: Partial<PetInput>
  ): Promise<Pet> {
    if (!petId) {
      throw new Error(
        'ไม่พบรหัสสัตว์เลี้ยง'
      );
    }

    const payload =
      createUpdatePayload(input);

    const { data, error } =
      await supabase
        .from('pets')
        .update(payload)
        .eq('id', petId)
        .select('*')
        .single();

    if (error) {
      console.error(
        'UPDATE PET ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถแก้ไขข้อมูลสัตว์เลี้ยงได้'
      );
    }

    return mapPet(
      data as PetRow
    );
  },

  async deletePet(
    petId: string
  ): Promise<void> {
    if (!petId) {
      throw new Error(
        'ไม่พบรหัสสัตว์เลี้ยง'
      );
    }

    const payload: PetUpdatePayload = {
      is_active: false,

      updated_at:
        new Date().toISOString(),
    };

    const { error } =
      await supabase
        .from('pets')
        .update(payload)
        .eq('id', petId);

    if (error) {
      console.error(
        'DELETE PET ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถลบข้อมูลสัตว์เลี้ยงได้'
      );
    }
  },
};