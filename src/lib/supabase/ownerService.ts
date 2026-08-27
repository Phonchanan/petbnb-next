import { supabase } from '@/lib/supabase/client';

export const OwnerService = {
  async getPetCount(ownerId: string): Promise<number> {
    if (!ownerId) {
      return 0;
    }

    const { count, error } = await supabase
      .from('pets')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('owner_id', ownerId)
      .eq('is_active', true);

    if (error) {
      console.error('GET PET COUNT ERROR:', error);
      throw new Error(error.message);
    }

    return count ?? 0;
  },

  async getRecentPets(ownerId: string) {
    if (!ownerId) {
      return [];
    }

    const { data, error } = await supabase
      .from('pets')
      .select(`
        id,
        name,
        category_id,
        breed,
        gender,
        weight,
        photo_url,
        behavior_notes,
        created_at
      `)
      .eq('owner_id', ownerId)
      .eq('is_active', true)
      .order('created_at', {
        ascending: false,
      })
      .limit(3);

    if (error) {
      console.error('GET RECENT PETS ERROR:', error);
      throw new Error(error.message);
    }

    return data ?? [];
  },
};