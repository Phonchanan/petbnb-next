import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * TYPES
 * ======================================================= */

export interface CertifiedCategory {
  categoryId: string;
  nameTh: string;
  icon: string | null;
  certifiedAt: string | null;
}

export interface SitterServiceItem {
  id: string;
  sitterId: string;
  categoryId: string;

  serviceName: string;
  description: string | null;

  price: number;
  priceUnit: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

interface CertifiedCategoryRow {
  category_id: string;

  certification_status: string;

  certified_at: string | null;

  pet_categories:
    | {
        id: string;
        name_th: string;
        icon: string | null;
      }
    | {
        id: string;
        name_th: string;
        icon: string | null;
      }[]
    | null;
}

interface ServiceRow {
  id: string;
  sitter_id: string;
  category_id: string;

  service_name: string;
  description: string | null;

  price: number | string;
  price_unit: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function mapService(
  row: ServiceRow
): SitterServiceItem {
  return {
    id: row.id,

    sitterId:
      row.sitter_id,

    categoryId:
      row.category_id,

    serviceName:
      row.service_name,

    description:
      row.description,

    price:
      Number(row.price),

    priceUnit:
      row.price_unit,

    isActive:
      row.is_active,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* =========================================================
 * SERVICE
 * ======================================================= */

export const SitterService = {
  /* =======================================================
   * GET CURRENT SITTER PROFILE ID
   * ===================================================== */

  async getCurrentSitterId(): Promise<string> {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(
        authError.message
      );
    }

    const user =
      authData.user;

    if (!user) {
      throw new Error(
        'กรุณาเข้าสู่ระบบ'
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        'sitter_profiles'
      )
      .select('id')
      .eq(
        'user_id',
        user.id
      )
      .maybeSingle();

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (!data) {
      throw new Error(
        'ไม่พบข้อมูล Sitter'
      );
    }

    return data.id as string;
  },

  /* =======================================================
   * GET CERTIFIED CATEGORIES
   * ===================================================== */

  async getCertifiedCategories(
    sitterId: string
  ): Promise<CertifiedCategory[]> {
    if (!sitterId) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        'sitter_categories'
      )
      .select(`
        category_id,
        certification_status,
        certified_at,
        pet_categories (
          id,
          name_th,
          icon
        )
      `)
      .eq(
        'sitter_id',
        sitterId
      )
      .eq(
        'certification_status',
        'CERTIFIED'
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        'GET CERTIFIED CATEGORIES ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดประเภทสัตว์ที่ผ่านการรับรองได้'
      );
    }

    const rows =
      (data ??
        []) as unknown as CertifiedCategoryRow[];

    return rows.map(
      (row) => {
        const relation =
          Array.isArray(
            row.pet_categories
          )
            ? row
                .pet_categories[0]
            : row.pet_categories;

        return {
          categoryId:
            row.category_id,

          nameTh:
            relation?.name_th ||
            row.category_id,

          icon:
            relation?.icon ??
            null,

          certifiedAt:
            row.certified_at,
        };
      }
    );
  },

  /* =======================================================
   * GET MY SERVICES
   * ===================================================== */

  async getServices(
    sitterId: string
  ): Promise<SitterServiceItem[]> {
    if (!sitterId) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
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
        is_active,
        created_at,
        updated_at
      `)
      .eq(
        'sitter_id',
        sitterId
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'GET SITTER SERVICES ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดบริการได้'
      );
    }

    return (
      (data ??
        []) as unknown as ServiceRow[]
    ).map(
      mapService
    );
  },

  /* =======================================================
   * CHECK CATEGORY CERTIFICATION
   * ===================================================== */

  async isCategoryCertified(
    sitterId: string,
    categoryId: string
  ): Promise<boolean> {
    const {
      data,
      error,
    } = await supabase
      .from(
        'sitter_categories'
      )
      .select(
        'category_id'
      )
      .eq(
        'sitter_id',
        sitterId
      )
      .eq(
        'category_id',
        categoryId
      )
      .eq(
        'certification_status',
        'CERTIFIED'
      )
      .maybeSingle();

    if (error) {
      throw new Error(
        error.message
      );
    }

    return Boolean(data);
  },

  /* =======================================================
   * CREATE SERVICE
   * ===================================================== */

  async createService({
    sitterId,
    categoryId,
    serviceName,
    description,
    price,
    priceUnit,
  }: {
    sitterId: string;
    categoryId: string;
    serviceName: string;
    description?: string;
    price: number;
    priceUnit: string;
  }): Promise<SitterServiceItem> {
    if (
      !sitterId ||
      !categoryId
    ) {
      throw new Error(
        'ข้อมูลไม่ครบถ้วน'
      );
    }

    if (
      !serviceName.trim()
    ) {
      throw new Error(
        'กรุณาระบุชื่อบริการ'
      );
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new Error(
        'กรุณาระบุราคาที่ถูกต้อง'
      );
    }

    /* ตรวจสิทธิ์จากการสอบจริง */

    const certified =
      await this.isCategoryCertified(
        sitterId,
        categoryId
      );

    if (!certified) {
      throw new Error(
        'คุณยังไม่ผ่านการรับรองสำหรับประเภทสัตว์นี้'
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        'sitter_services'
      )
      .insert({
        sitter_id:
          sitterId,

        category_id:
          categoryId,

        service_name:
          serviceName.trim(),

        description:
          description?.trim() ||
          null,

        price,

        price_unit:
          priceUnit,

        is_active:
          true,
      })
      .select(`
        id,
        sitter_id,
        category_id,
        service_name,
        description,
        price,
        price_unit,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error(
        'CREATE SITTER SERVICE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถเพิ่มบริการได้'
      );
    }

    return mapService(
      data as unknown as ServiceRow
    );
  },

  /* =======================================================
   * UPDATE SERVICE
   * ===================================================== */

  async updateService({
    id,
    sitterId,
    categoryId,
    serviceName,
    description,
    price,
    priceUnit,
    isActive,
  }: {
    id: string;
    sitterId: string;
    categoryId: string;
    serviceName: string;
    description?: string;
    price: number;
    priceUnit: string;
    isActive: boolean;
  }): Promise<SitterServiceItem> {
    const certified =
      await this.isCategoryCertified(
        sitterId,
        categoryId
      );

    if (!certified) {
      throw new Error(
        'ไม่สามารถเปิดบริการสำหรับประเภทสัตว์ที่ยังไม่ผ่านการรับรองได้'
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        'sitter_services'
      )
      .update({
        category_id:
          categoryId,

        service_name:
          serviceName.trim(),

        description:
          description?.trim() ||
          null,

        price,

        price_unit:
          priceUnit,

        is_active:
          isActive,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        id
      )
      .eq(
        'sitter_id',
        sitterId
      )
      .select(`
        id,
        sitter_id,
        category_id,
        service_name,
        description,
        price,
        price_unit,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error(
        'UPDATE SITTER SERVICE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถแก้ไขบริการได้'
      );
    }

    return mapService(
      data as unknown as ServiceRow
    );
  },

  /* =======================================================
   * TOGGLE ACTIVE
   * ===================================================== */

  async setActive(
    service: SitterServiceItem,
    active: boolean
  ): Promise<void> {
    if (active) {
      const certified =
        await this.isCategoryCertified(
          service.sitterId,
          service.categoryId
        );

      if (!certified) {
        throw new Error(
          'ไม่สามารถเปิดบริการนี้ได้ เนื่องจากประเภทสัตว์ไม่ได้รับการรับรอง'
        );
      }
    }

    const {
      error,
    } = await supabase
      .from(
        'sitter_services'
      )
      .update({
        is_active:
          active,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        service.id
      )
      .eq(
        'sitter_id',
        service.sitterId
      );

    if (error) {
      throw new Error(
        error.message ||
          'ไม่สามารถเปลี่ยนสถานะบริการได้'
      );
    }
  },

  /* =======================================================
   * DELETE
   * ===================================================== */

  async deleteService(
    id: string,
    sitterId: string
  ): Promise<void> {
    const {
      error,
    } = await supabase
      .from(
        'sitter_services'
      )
      .delete()
      .eq(
        'id',
        id
      )
      .eq(
        'sitter_id',
        sitterId
      );

    if (error) {
      throw new Error(
        error.message ||
          'ไม่สามารถลบบริการได้'
      );
    }
  },
};