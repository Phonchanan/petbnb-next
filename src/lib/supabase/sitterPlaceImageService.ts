import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * CONSTANTS
 * ======================================================= */

const BUCKET_NAME =
  'sitter-place-images';

export const MAX_SITTER_PLACE_IMAGES =
  5;

/* =========================================================
 * TYPES
 * ======================================================= */

export interface SitterPlaceImage {
  id: string;

  sitterId: string;

  /*
   * ค่าใน DB
   * ปัจจุบัน image_url เก็บ Storage Path เช่น:
   *
   * user-id/place-xxxx.jpg
   */
  imagePath: string;

  /*
   * Public URL ที่ใช้แสดงรูป
   */
  imageUrl: string;

  displayOrder: number;

  createdAt: string;
}

/* =========================================================
 * DATABASE TYPES
 * ======================================================= */

interface SitterPlaceImageRow {
  id: string;

  sitter_id: string;

  /*
   * schema จริงของคุณใช้ image_url
   */
  image_url: string;

  display_order: number;

  created_at: string;
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function getPublicUrl(
  imagePath: string
): string {
  const { data } =
    supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(imagePath);

  return data.publicUrl;
}

function mapRow(
  row: SitterPlaceImageRow
): SitterPlaceImage {
  return {
    id:
      row.id,

    sitterId:
      row.sitter_id,

    /*
     * image_url ใน DB คือ Storage Path
     */
    imagePath:
      row.image_url,

    /*
     * แปลง Storage Path เป็น Public URL
     */
    imageUrl:
      getPublicUrl(
        row.image_url
      ),

    displayOrder:
      row.display_order,

    createdAt:
      row.created_at,
  };
}

/* =========================================================
 * SERVICE
 * ======================================================= */

export const SitterPlaceImageService = {
  /* =======================================================
   * GET IMAGES
   * ===================================================== */

  async getImages(
    sitterId: string
  ): Promise<SitterPlaceImage[]> {
    if (!sitterId) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        'sitter_place_images'
      )
      .select(`
        id,
        sitter_id,
        image_url,
        display_order,
        created_at
      `)
      .eq(
        'sitter_id',
        sitterId
      )
      .order(
        'display_order',
        {
          ascending: true,
        }
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        'GET SITTER PLACE IMAGES ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดรูปสถานที่ได้'
      );
    }

    const rows =
      (data ??
        []) as unknown as SitterPlaceImageRow[];

    return rows.map(
      mapRow
    );
  },

  /* =======================================================
   * UPLOAD SINGLE IMAGE
   * ===================================================== */

  async uploadImage(
    sitterId: string,
    userId: string,
    file: File,
    displayOrder: number
  ): Promise<SitterPlaceImage> {
    if (!sitterId) {
      throw new Error(
        'ไม่พบข้อมูล Sitter'
      );
    }

    if (!userId) {
      throw new Error(
        'ไม่พบข้อมูลผู้ใช้งาน'
      );
    }

    if (!file) {
      throw new Error(
        'กรุณาเลือกรูปภาพ'
      );
    }

    /* =====================================================
     * VALIDATE FILE TYPE
     * =================================================== */

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      throw new Error(
        'สามารถอัปโหลดได้เฉพาะไฟล์รูปภาพ'
      );
    }

    /* =====================================================
     * MAX 5 MB
     * =================================================== */

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {
      throw new Error(
        'ขนาดรูปต้องไม่เกิน 5 MB'
      );
    }

    /* =====================================================
     * CHECK CURRENT IMAGE COUNT
     * =================================================== */

    const currentImages =
      await this.getImages(
        sitterId
      );

    if (
      currentImages.length >=
      MAX_SITTER_PLACE_IMAGES
    ) {
      throw new Error(
        `อัปโหลดรูปสถานที่ได้สูงสุด ${MAX_SITTER_PLACE_IMAGES} รูป`
      );
    }

    /* =====================================================
     * FILE NAME
     * =================================================== */

    const rawExtension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase();

    const extension =
      rawExtension ||
      'jpg';

    const fileName =
      `place-${crypto.randomUUID()}.${extension}`;

    /*
     * Storage RLS ของเรากำหนดว่า
     * folder แรกต้องเป็น auth.uid()
     */
    const imagePath =
      `${userId}/${fileName}`;

    /* =====================================================
     * 1. UPLOAD TO STORAGE
     * =================================================== */

    const {
      error:
        uploadError,
    } = await supabase.storage
      .from(
        BUCKET_NAME
      )
      .upload(
        imagePath,
        file,
        {
          cacheControl:
            '3600',

          upsert:
            false,

          contentType:
            file.type,
        }
      );

    if (uploadError) {
      console.error(
        'UPLOAD SITTER PLACE IMAGE ERROR:',
        uploadError
      );

      throw new Error(
        uploadError.message ||
          'ไม่สามารถอัปโหลดรูปสถานที่ได้'
      );
    }

    /* =====================================================
     * 2. INSERT DATABASE
     *
     * สำคัญ:
     * schema จริงใช้ image_url
     * =================================================== */

    const {
      data,
      error:
        insertError,
    } = await supabase
      .from(
        'sitter_place_images'
      )
      .insert({
        sitter_id:
          sitterId,

        image_url:
          imagePath,

        display_order:
          displayOrder,
      })
      .select(`
        id,
        sitter_id,
        image_url,
        display_order,
        created_at
      `)
      .single();

    if (insertError) {
      /*
       * ถ้า insert DB ไม่ผ่าน
       * ให้ลบไฟล์ออกจาก Storage
       * เพื่อไม่ทิ้ง orphan file
       */

      const {
        error:
          cleanupError,
      } = await supabase.storage
        .from(
          BUCKET_NAME
        )
        .remove([
          imagePath,
        ]);

      if (cleanupError) {
        console.error(
          'CLEANUP PLACE IMAGE ERROR:',
          cleanupError
        );
      }

      console.error(
        'INSERT SITTER PLACE IMAGE ERROR:',
        insertError
      );

      throw new Error(
        insertError.message ||
          'ไม่สามารถบันทึกรูปสถานที่ได้'
      );
    }

    return mapRow(
      data as unknown as SitterPlaceImageRow
    );
  },

  /* =======================================================
   * UPLOAD MULTIPLE IMAGES
   * ===================================================== */

  async uploadImages(
    sitterId: string,
    userId: string,
    files: File[]
  ): Promise<SitterPlaceImage[]> {
    if (
      files.length === 0
    ) {
      return [];
    }

    /* =====================================================
     * CHECK CURRENT COUNT
     * =================================================== */

    const currentImages =
      await this.getImages(
        sitterId
      );

    const remaining =
      MAX_SITTER_PLACE_IMAGES -
      currentImages.length;

    if (
      remaining <= 0
    ) {
      throw new Error(
        `อัปโหลดรูปสถานที่ได้สูงสุด ${MAX_SITTER_PLACE_IMAGES} รูป`
      );
    }

    if (
      files.length >
      remaining
    ) {
      throw new Error(
        `สามารถเพิ่มรูปได้อีก ${remaining} รูป`
      );
    }

    /* =====================================================
     * PRE-VALIDATE FILES
     *
     * ตรวจทั้งหมดก่อน upload
     * ป้องกัน upload ไปบางรูปแล้วค่อยเจอ error
     * =================================================== */

    const maxSize =
      5 * 1024 * 1024;

    for (
      const file of
      files
    ) {
      if (
        !file.type.startsWith(
          'image/'
        )
      ) {
        throw new Error(
          `"${file.name}" ไม่ใช่ไฟล์รูปภาพ`
        );
      }

      if (
        file.size >
        maxSize
      ) {
        throw new Error(
          `"${file.name}" มีขนาดเกิน 5 MB`
        );
      }
    }

    /* =====================================================
     * UPLOAD
     * =================================================== */

    const uploaded:
      SitterPlaceImage[] =
      [];

    for (
      let index = 0;
      index <
      files.length;
      index += 1
    ) {
      const image =
        await this.uploadImage(
          sitterId,
          userId,
          files[index],
          currentImages.length +
            index
        );

      uploaded.push(
        image
      );
    }

    return uploaded;
  },

  /* =======================================================
   * DELETE IMAGE
   * ===================================================== */

  async deleteImage(
    image: SitterPlaceImage
  ): Promise<void> {
    if (!image.id) {
      throw new Error(
        'ไม่พบข้อมูลรูปภาพ'
      );
    }

    /* =====================================================
     * 1. DELETE DATABASE RECORD
     * =================================================== */

    const {
      error:
        deleteDbError,
    } = await supabase
      .from(
        'sitter_place_images'
      )
      .delete()
      .eq(
        'id',
        image.id
      );

    if (
      deleteDbError
    ) {
      console.error(
        'DELETE SITTER PLACE IMAGE DB ERROR:',
        deleteDbError
      );

      throw new Error(
        deleteDbError.message ||
          'ไม่สามารถลบข้อมูลรูปได้'
      );
    }

    /* =====================================================
     * 2. DELETE STORAGE FILE
     * =================================================== */

    if (
      image.imagePath
    ) {
      const {
        error:
          storageError,
      } = await supabase.storage
        .from(
          BUCKET_NAME
        )
        .remove([
          image.imagePath,
        ]);

      if (
        storageError
      ) {
        /*
         * DB ถูกลบไปแล้ว
         * จึงแค่ log storage error
         */
        console.error(
          'DELETE SITTER PLACE IMAGE STORAGE ERROR:',
          storageError
        );
      }
    }
  },

  /* =======================================================
   * UPDATE IMAGE ORDER
   * ===================================================== */

  async updateOrder(
    images: SitterPlaceImage[]
  ): Promise<void> {
    if (
      images.length === 0
    ) {
      return;
    }

    for (
      let index = 0;
      index <
      images.length;
      index += 1
    ) {
      const image =
        images[index];

      const {
        error,
      } = await supabase
        .from(
          'sitter_place_images'
        )
        .update({
          display_order:
            index,
        })
        .eq(
          'id',
          image.id
        );

      if (error) {
        console.error(
          'UPDATE PLACE IMAGE ORDER ERROR:',
          error
        );

        throw new Error(
          error.message ||
            'ไม่สามารถจัดลำดับรูปได้'
        );
      }
    }
  },
};