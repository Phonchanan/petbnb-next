import { supabase } from '@/lib/supabase/client';

export interface CareUpdateImage {
  id: string;
  updateId: string;
  imageUrl: string;
  createdAt: string;
}

export interface CareUpdate {
  id: string;
  bookingId: string;
  sitterId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  images: CareUpdateImage[];
}

interface CareUpdateRow {
  id: string;
  booking_id: string;
  sitter_id: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface CareUpdateImageRow {
  id: string;
  update_id: string;
  image_url: string;
  created_at: string;
}

export interface CreateCareUpdateInput {
  bookingId: string;
  sitterProfileId: string;
  message: string;
  images?: File[];
}

function mapImage(
  row: CareUpdateImageRow
): CareUpdateImage {
  return {
    id: row.id,
    updateId: row.update_id,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

function mapUpdate(
  row: CareUpdateRow,
  images: CareUpdateImage[]
): CareUpdate {
  return {
    id: row.id,
    bookingId: row.booking_id,
    sitterId: row.sitter_id,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images,
  };
}

function getFileExtension(
  file: File
) {
  const parts =
    file.name.split('.');

  if (
    parts.length <= 1
  ) {
    return 'jpg';
  }

  return (
    parts.pop()?.toLowerCase() ||
    'jpg'
  );
}

export const CareUpdateService = {
  async getByBookingId(
    bookingId: string
  ): Promise<CareUpdate[]> {
    if (!bookingId) {
      return [];
    }

    const {
      data: updates,
      error: updateError,
    } = await supabase
      .from(
        'booking_care_updates'
      )
      .select(`
        id,
        booking_id,
        sitter_id,
        message,
        created_at,
        updated_at
      `)
      .eq(
        'booking_id',
        bookingId
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (updateError) {
      console.error(
        'GET CARE UPDATES ERROR:',
        updateError
      );

      throw new Error(
        updateError.message ||
          'ไม่สามารถโหลดอัปเดตการดูแลได้'
      );
    }

    const updateRows =
      (updates ??
        []) as CareUpdateRow[];

    if (
      updateRows.length === 0
    ) {
      return [];
    }

    const updateIds =
      updateRows.map(
        (item) => item.id
      );

    const {
      data: images,
      error: imageError,
    } = await supabase
      .from(
        'booking_care_update_images'
      )
      .select(`
        id,
        update_id,
        image_url,
        created_at
      `)
      .in(
        'update_id',
        updateIds
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (imageError) {
      console.error(
        'GET CARE UPDATE IMAGES ERROR:',
        imageError
      );

      throw new Error(
        imageError.message ||
          'ไม่สามารถโหลดรูปภาพอัปเดตได้'
      );
    }

    const imageRows =
      (images ??
        []) as CareUpdateImageRow[];

    const imageMap =
      new Map<
        string,
        CareUpdateImage[]
      >();

    for (
      const imageRow of
      imageRows
    ) {
      const current =
        imageMap.get(
          imageRow.update_id
        ) ?? [];

      current.push(
        mapImage(imageRow)
      );

      imageMap.set(
        imageRow.update_id,
        current
      );
    }

    return updateRows.map(
      (row) =>
        mapUpdate(
          row,
          imageMap.get(
            row.id
          ) ?? []
        )
    );
  },

  async createUpdate(
    input: CreateCareUpdateInput
  ): Promise<CareUpdate> {
    const cleanMessage =
      input.message.trim();

    if (!cleanMessage) {
      throw new Error(
        'กรุณากรอกรายละเอียดการดูแล'
      );
    }

    if (!input.bookingId) {
      throw new Error(
        'ไม่พบรหัสการจอง'
      );
    }

    if (
      !input.sitterProfileId
    ) {
      throw new Error(
        'ไม่พบข้อมูลผู้รับฝาก'
      );
    }

    if (
      input.images &&
      input.images.length > 4
    ) {
      throw new Error(
        'สามารถอัปโหลดรูปได้สูงสุด 4 รูปต่ออัปเดต'
      );
    }

    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'GET SESSION ERROR:',
        sessionError
      );

      throw new Error(
        'ไม่สามารถตรวจสอบการเข้าสู่ระบบได้'
      );
    }

    if (!session?.user) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่'
      );
    }

    const {
      data: sitterProfile,
      error: sitterError,
    } = await supabase
      .from(
        'sitter_profiles'
      )
      .select(`
        id,
        user_id
      `)
      .eq(
        'id',
        input.sitterProfileId
      )
      .eq(
        'user_id',
        session.user.id
      )
      .maybeSingle();

    if (sitterError) {
      console.error(
        'GET SITTER PROFILE ERROR:',
        sitterError
      );

      throw new Error(
        sitterError.message
      );
    }

    if (!sitterProfile) {
      throw new Error(
        'คุณไม่มีสิทธิ์เพิ่มอัปเดตให้การจองนี้'
      );
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from('bookings')
      .select(`
        id,
        sitter_id,
        status
      `)
      .eq(
        'id',
        input.bookingId
      )
      .eq(
        'sitter_id',
        input.sitterProfileId
      )
      .maybeSingle();

    if (bookingError) {
      console.error(
        'GET BOOKING BEFORE CREATE UPDATE ERROR:',
        bookingError
      );

      throw new Error(
        bookingError.message
      );
    }

    if (!booking) {
      throw new Error(
        'ไม่พบข้อมูลการจอง'
      );
    }

    if (
      booking.status !==
      'IN_PROGRESS'
    ) {
      throw new Error(
        'สามารถอัปเดตการดูแลได้เฉพาะตอนที่กำลังให้บริการ'
      );
    }

    const {
      data: insertedUpdate,
      error: insertError,
    } = await supabase
      .from(
        'booking_care_updates'
      )
      .insert({
        booking_id:
          input.bookingId,

        sitter_id:
          input.sitterProfileId,

        message:
          cleanMessage,
      })
      .select(`
        id,
        booking_id,
        sitter_id,
        message,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error(
        'CREATE CARE UPDATE ERROR:',
        insertError
      );

      throw new Error(
        insertError.message ||
          'ไม่สามารถบันทึกอัปเดตการดูแลได้'
      );
    }

    const updateRow =
      insertedUpdate as CareUpdateRow;

    const uploadedImages:
      CareUpdateImage[] = [];

    try {
      for (
        const [
          index,
          file,
        ] of (
          input.images ?? []
        ).entries()
      ) {
        if (
          !file.type.startsWith(
            'image/'
          )
        ) {
          throw new Error(
            'รองรับเฉพาะไฟล์รูปภาพเท่านั้น'
          );
        }

        const maxSize =
          5 * 1024 * 1024;

        if (
          file.size >
          maxSize
        ) {
          throw new Error(
            'รูปภาพแต่ละรูปต้องมีขนาดไม่เกิน 5 MB'
          );
        }

        const extension =
          getFileExtension(
            file
          );

        const filePath =
          `${input.bookingId}/${updateRow.id}/${Date.now()}-${index}.${extension}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              'booking-care-images'
            )
            .upload(
              filePath,
              file,
              {
                cacheControl:
                  '3600',

                upsert:
                  false,
              }
            );

        if (uploadError) {
          console.error(
            'UPLOAD CARE IMAGE ERROR:',
            uploadError
          );

          throw new Error(
            uploadError.message ||
              'ไม่สามารถอัปโหลดรูปภาพได้'
          );
        }

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from(
              'booking-care-images'
            )
            .getPublicUrl(
              filePath
            );

        const imageUrl =
          publicUrlData
            .publicUrl;

        const {
          data:
            insertedImage,
          error:
            imageInsertError,
        } = await supabase
          .from(
            'booking_care_update_images'
          )
          .insert({
            update_id:
              updateRow.id,

            image_url:
              imageUrl,
          })
          .select(`
            id,
            update_id,
            image_url,
            created_at
          `)
          .single();

        if (
          imageInsertError
        ) {
          console.error(
            'CREATE CARE IMAGE ROW ERROR:',
            imageInsertError
          );

          throw new Error(
            imageInsertError.message ||
              'ไม่สามารถบันทึกข้อมูลรูปภาพได้'
          );
        }

        uploadedImages.push(
          mapImage(
            insertedImage as CareUpdateImageRow
          )
        );
      }
    } catch (error) {
      /*
       * ถ้ารูปมีปัญหา
       * ลบ update ที่สร้างไว้
       * เพื่อไม่ให้เกิดข้อมูลค้าง
       */
      const {
        error:
          rollbackError,
      } = await supabase
        .from(
          'booking_care_updates'
        )
        .delete()
        .eq(
          'id',
          updateRow.id
        );

      if (
        rollbackError
      ) {
        console.error(
          'ROLLBACK CARE UPDATE ERROR:',
          rollbackError
        );
      }

      throw error;
    }

    return mapUpdate(
      updateRow,
      uploadedImages
    );
  },

  async deleteUpdate(
    updateId: string,
    sitterProfileId: string
  ): Promise<void> {
    if (!updateId) {
      throw new Error(
        'ไม่พบอัปเดตที่ต้องการลบ'
      );
    }

    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user
    ) {
      throw new Error(
        'กรุณาเข้าสู่ระบบใหม่'
      );
    }

    const {
      data: sitterProfile,
      error: sitterError,
    } = await supabase
      .from(
        'sitter_profiles'
      )
      .select(`
        id,
        user_id
      `)
      .eq(
        'id',
        sitterProfileId
      )
      .eq(
        'user_id',
        session.user.id
      )
      .maybeSingle();

    if (sitterError) {
      throw new Error(
        sitterError.message
      );
    }

    if (!sitterProfile) {
      throw new Error(
        'คุณไม่มีสิทธิ์ลบอัปเดตนี้'
      );
    }

    const {
      error,
    } = await supabase
      .from(
        'booking_care_updates'
      )
      .delete()
      .eq(
        'id',
        updateId
      )
      .eq(
        'sitter_id',
        sitterProfileId
      );

    if (error) {
      console.error(
        'DELETE CARE UPDATE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถลบอัปเดตได้'
      );
    }
  },
};