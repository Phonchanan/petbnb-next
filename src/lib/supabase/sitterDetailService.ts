import { supabase } from '@/lib/supabase/client';

export interface SitterServiceItem {
  id: string;
  categoryId: string;
  serviceName: string;
  description: string | null;
  price: number;
  priceUnit: string;
}

export interface SitterReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface SitterDetail {
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

  services: SitterServiceItem[];

  averageRating: number;
  reviewCount: number;
  reviews: SitterReviewItem[];
}

interface SitterProfileRow {
  id: string;
  user_id: string;

  location_id: string | null;

  house_type: string | null;
  specialty: string | null;

  experience_years: number;

  starting_price:
    | number
    | string;

  is_verified: boolean;
  is_available: boolean;
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

interface ServiceRow {
  id: string;
  sitter_id: string;

  category_id: string;

  service_name: string;
  description: string | null;

  price:
    | number
    | string;

  price_unit: string;

  is_active: boolean;
}

interface ReviewRow {
  id: string;
  sitter_id: string;

  rating: number;

  comment: string | null;

  created_at: string;
}

export const SitterDetailService = {
  async getById(
    sitterProfileId: string
  ): Promise<SitterDetail | null> {
    if (!sitterProfileId) {
      return null;
    }

    /* =====================================================
     * 1. LOAD SITTER PROFILE
     * =================================================== */

    const {
      data: sitterProfile,
      error: sitterError,
    } = await supabase
      .from('sitter_profiles')
      .select(`
        id,
        user_id,
        location_id,
        house_type,
        specialty,
        experience_years,
        starting_price,
        is_verified,
        is_available
      `)
      .eq(
        'id',
        sitterProfileId
      )
      .maybeSingle();

    if (sitterError) {
      console.error(
        'GET SITTER DETAIL ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message ||
          'ไม่สามารถโหลดข้อมูลผู้รับฝากได้'
      );
    }

    if (!sitterProfile) {
      return null;
    }

    const sitter =
      sitterProfile as unknown as SitterProfileRow;

    /* =====================================================
     * 2. PROFILE
     * =================================================== */

    const profilePromise =
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
        .eq(
          'id',
          sitter.user_id
        )
        .maybeSingle();

    /* =====================================================
     * 3. LOCATION
     * =================================================== */

    const locationPromise =
      sitter.location_id
        ? supabase
            .from('locations')
            .select(`
              id,
              province,
              district,
              area
            `)
            .eq(
              'id',
              sitter.location_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          });

    /* =====================================================
     * 4. OTHER DATA
     * =================================================== */

    const categoriesPromise =
      supabase
        .from(
          'sitter_categories'
        )
        .select(`
          sitter_id,
          category_id
        `)
        .eq(
          'sitter_id',
          sitter.id
        );

    const servicesPromise =
      supabase
        .from(
          'sitter_services'
        )
        .select(`
          id,
          sitter_id,
          category_id,
          service_name,
          description,
          price,
          price_unit,
          is_active
        `)
        .eq(
          'sitter_id',
          sitter.id
        )
        .eq(
          'is_active',
          true
        )
        .order(
          'price',
          {
            ascending: true,
          }
        );

    const reviewsPromise =
      supabase
        .from('reviews')
        .select(`
          id,
          sitter_id,
          rating,
          comment,
          created_at
        `)
        .eq(
          'sitter_id',
          sitter.id
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    const [
      profileResult,
      locationResult,
      categoriesResult,
      servicesResult,
      reviewsResult,
    ] = await Promise.all([
      profilePromise,
      locationPromise,
      categoriesPromise,
      servicesPromise,
      reviewsPromise,
    ]);

    /* =====================================================
     * 5. ERROR CHECK
     * =================================================== */

    if (profileResult.error) {
      console.error(
        'GET SITTER PROFILE USER ERROR:',
        profileResult.error
      );

      throw new Error(
        profileResult.error.message
      );
    }

    if (locationResult.error) {
      console.error(
        'GET SITTER LOCATION ERROR:',
        locationResult.error
      );

      throw new Error(
        locationResult.error.message
      );
    }

    if (categoriesResult.error) {
      console.error(
        'GET SITTER CATEGORIES ERROR:',
        categoriesResult.error
      );

      throw new Error(
        categoriesResult.error.message
      );
    }

    if (servicesResult.error) {
      console.error(
        'GET SITTER SERVICES ERROR:',
        servicesResult.error
      );

      throw new Error(
        servicesResult.error.message
      );
    }

    /*
     * รีวิวไม่ควรทำให้ทั้งหน้า Sitter เปิดไม่ได้
     */
    if (reviewsResult.error) {
      console.error(
        'GET SITTER REVIEWS ERROR:',
        reviewsResult.error
      );
    }

    /* =====================================================
     * 6. MAP DATA
     * =================================================== */

    const profile =
      profileResult.data as
        | ProfileRow
        | null;

    const location =
      locationResult.data as
        | LocationRow
        | null;

    const categories =
      (categoriesResult.data ??
        []) as CategoryRow[];

    const services =
      (servicesResult.data ??
        []) as ServiceRow[];

    const reviews =
      reviewsResult.error
        ? []
        : ((reviewsResult.data ??
            []) as ReviewRow[]);

    /* =====================================================
     * RATING
     * =================================================== */

    const reviewCount =
      reviews.length;

    const averageRating =
      reviewCount > 0
        ? reviews.reduce(
            (
              total,
              review
            ) =>
              total +
              Number(
                review.rating
              ),
            0
          ) / reviewCount
        : 0;

    /* =====================================================
     * DISPLAY NAME
     * =================================================== */

    const fullName = [
      profile?.first_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    /* =====================================================
     * RETURN
     * =================================================== */

    return {
      sitterProfileId:
        sitter.id,

      userId:
        sitter.user_id,

      displayName:
        profile
          ?.display_name
          ?.trim() ||
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
        Number(
          sitter.experience_years
        ),

      startingPrice:
        Number(
          sitter.starting_price
        ),

      isVerified:
        sitter.is_verified,

      isAvailable:
        sitter.is_available,

      categories:
        categories.map(
          (item) =>
            item.category_id
        ),

      services:
        services.map(
          (
            service
          ): SitterServiceItem => ({
            id:
              service.id,

            categoryId:
              service.category_id,

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
          })
        ),

      averageRating,

      reviewCount,

      reviews:
        reviews.map(
          (
            review
          ): SitterReviewItem => ({
            id:
              review.id,

            rating:
              Number(
                review.rating
              ),

            comment:
              review.comment,

            createdAt:
              review.created_at,
          })
        ),
    };
  },
};