import { supabase } from '@/lib/supabase/client';

export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

export const ProfileService = {
  async updateProfile(
    userId: string,
    input: ProfileUpdateInput
  ) {
    const payload = {
      first_name: input.firstName?.trim() || null,
      last_name: input.lastName?.trim() || null,
      display_name: input.displayName?.trim() || null,
      phone: input.phone?.trim() || null,
      bio: input.bio?.trim() || null,
      avatar_url: input.avatarUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('UPDATE PROFILE ERROR:', error);
      throw new Error(
        error.message || 'ไม่สามารถแก้ไขโปรไฟล์ได้'
      );
    }

    return data;
  },
};