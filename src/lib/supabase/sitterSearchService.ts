import { supabase } from '@/lib/supabase/client';

export interface SitterSearchResult {
  sitterProfileId: string;
  userId: string;

  displayName: string;
  avatarUrl: string | null;
  bio: string | null;

  province: string;
  district: string;
  area: string;

  houseType: string | null;
  specialty: string | null;

  experienceYears: number;

  startingPrice: number;

  isVerified: boolean;
  isAvailable: boolean;

  categories: string[];

  averageRating: number;
  reviewCount: number;
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
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface LocationRow {
  id: string;
  province: string;
  district: string;
  area: string;
}

interface CategoryRow {
  sitter_id: string;
  category_id: string;
}

interface ReviewRow {
  sitter_id: string;
  rating: number;
}

export const SitterSearchService = {
  async getSitters(): Promise<SitterSearchResult[]> {
    const { data: sitterProfiles, error: sitterError } =
      await supabase
        .from('sitter_profiles')
        .select('*')
        .eq('is_available', true);

    if (sitterError) {
      console.error(
        'GET SITTER PROFILES ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message ||
          'ไม่สามารถโหลดข้อมูลผู้รับฝากได้'
      );
    }

    const sitters =
      (sitterProfiles ?? []) as SitterProfileRow[];

    if (sitters.length === 0) {
      return [];
    }

    const userIds =
      sitters.map(
        (item) => item.user_id
      );

    const sitterIds =
      sitters.map(
        (item) => item.id
      );

    const locationIds =
      [
        ...new Set(
          sitters.map(
            (item) => item.location_id
          )
        ),
      ];

    const [
      profilesResult,
      locationsResult,
      categoriesResult,
      reviewsResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          first_name,
          last_name,
          avatar_url,
          bio
        `)
        .in('id', userIds),

      supabase
        .from('locations')
        .select(`
          id,
          province,
          district,
          area
        `)
        .in('id', locationIds),

      supabase
        .from('sitter_categories')
        .select(`
          sitter_id,
          category_id
        `)
        .in('sitter_id', sitterIds),

      supabase
        .from('reviews')
        .select(`
          sitter_id,
          rating
        `)
        .in('sitter_id', sitterIds),
    ]);

    if (profilesResult.error) {
      throw new Error(
        profilesResult.error.message
      );
    }

    if (locationsResult.error) {
      throw new Error(
        locationsResult.error.message
      );
    }

    if (categoriesResult.error) {
      throw new Error(
        categoriesResult.error.message
      );
    }

    if (reviewsResult.error) {
      throw new Error(
        reviewsResult.error.message
      );
    }

    const profiles =
      (profilesResult.data ??
        []) as ProfileRow[];

    const locations =
      (locationsResult.data ??
        []) as LocationRow[];

    const categories =
      (categoriesResult.data ??
        []) as CategoryRow[];

    const reviews =
      (reviewsResult.data ??
        []) as ReviewRow[];

    return sitters.map(
      (sitter) => {
        const profile =
          profiles.find(
            (item) =>
              item.id ===
              sitter.user_id
          );

        const location =
          locations.find(
            (item) =>
              item.id ===
              sitter.location_id
          );

        const sitterCategories =
          categories
            .filter(
              (item) =>
                item.sitter_id ===
                sitter.id
            )
            .map(
              (item) =>
                item.category_id
            );

        const sitterReviews =
          reviews.filter(
            (item) =>
              item.sitter_id ===
              sitter.id
          );

        const reviewCount =
          sitterReviews.length;

        const averageRating =
          reviewCount > 0
            ? sitterReviews.reduce(
                (sum, item) =>
                  sum + item.rating,
                0
              ) / reviewCount
            : 0;

        const fullName =
          `${profile?.first_name ?? ''} ${
            profile?.last_name ?? ''
          }`.trim();

        return {
          sitterProfileId:
            sitter.id,

          userId:
            sitter.user_id,

          displayName:
            profile?.display_name ||
            fullName ||
            'ผู้รับฝากสัตว์เลี้ยง',

          avatarUrl:
            profile?.avatar_url ??
            null,

          bio:
            profile?.bio ??
            null,

          province:
            location?.province ??
            '',

          district:
            location?.district ??
            '',

          area:
            location?.area ??
            '',

          houseType:
            sitter.house_type,

          specialty:
            sitter.specialty,

          experienceYears:
            sitter.experience_years,

          startingPrice:
            Number(
              sitter.starting_price
            ),

          isVerified:
            sitter.is_verified,

          isAvailable:
            sitter.is_available,

          categories:
            sitterCategories,

          averageRating,

          reviewCount,
        };
      }
    );
  },
};