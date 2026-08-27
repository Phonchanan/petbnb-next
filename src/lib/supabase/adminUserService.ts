import { supabase } from '@/lib/supabase/client';

/* =========================================================
 * TYPES
 * ======================================================= */

export type AdminUserRole =
  | 'OWNER'
  | 'SITTER'
  | 'ADMIN';

export interface AdminUserListItem {
  id: string;

  firstName: string | null;
  lastName: string | null;
  displayName: string | null;

  phone: string | null;
  avatarUrl: string | null;

  role: AdminUserRole;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface AdminUserStats {
  total: number;
  owners: number;
  sitters: number;
  admins: number;

  active: number;
  inactive: number;
}

/* =========================================================
 * DATABASE TYPES
 * ======================================================= */

interface ProfileRow {
  id: string;

  first_name: string | null;
  last_name: string | null;
  display_name: string | null;

  phone: string | null;
  avatar_url: string | null;

  role: string;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

/* =========================================================
 * HELPERS
 * ======================================================= */

function normalizeRole(
  role: string | null | undefined
): AdminUserRole {
  const value =
    role?.trim().toUpperCase();

  if (value === 'SITTER') {
    return 'SITTER';
  }

  if (value === 'ADMIN') {
    return 'ADMIN';
  }

  return 'OWNER';
}

function getDisplayName(
  row: ProfileRow
): string | null {
  if (row.display_name?.trim()) {
    return row.display_name.trim();
  }

  const fullName = [
    row.first_name,
    row.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || null;
}

function mapProfileRow(
  row: ProfileRow
): AdminUserListItem {
  return {
    id: row.id,

    firstName:
      row.first_name,

    lastName:
      row.last_name,

    displayName:
      getDisplayName(row),

    phone:
      row.phone,

    avatarUrl:
      row.avatar_url,

    role:
      normalizeRole(
        row.role
      ),

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

export const AdminUserService = {
  /* =======================================================
   * GET ALL USERS
   * ===================================================== */

  async getUsers(): Promise<
    AdminUserListItem[]
  > {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        phone,
        avatar_url,
        role,
        is_active,
        created_at,
        updated_at
      `)
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'GET ADMIN USERS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลสมาชิกได้'
      );
    }

    const rows =
      (data ??
        []) as unknown as ProfileRow[];

    return rows.map(
      mapProfileRow
    );
  },

  /* =======================================================
   * GET USER BY ID
   * ===================================================== */

  async getUserById(
    userId: string
  ): Promise<AdminUserListItem | null> {
    if (!userId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        phone,
        avatar_url,
        role,
        is_active,
        created_at,
        updated_at
      `)
      .eq(
        'id',
        userId
      )
      .maybeSingle();

    if (error) {
      console.error(
        'GET ADMIN USER DETAIL ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลสมาชิกได้'
      );
    }

    if (!data) {
      return null;
    }

    const row =
      data as unknown as ProfileRow;

    return mapProfileRow(
      row
    );
  },

  /* =======================================================
   * GET USERS BY ROLE
   * ===================================================== */

  async getUsersByRole(
    role: AdminUserRole
  ): Promise<AdminUserListItem[]> {
    const normalizedRole =
      role.toUpperCase();

    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        phone,
        avatar_url,
        role,
        is_active,
        created_at,
        updated_at
      `)
      .eq(
        'role',
        normalizedRole
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'GET USERS BY ROLE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดสมาชิกตามประเภทได้'
      );
    }

    const rows =
      (data ??
        []) as unknown as ProfileRow[];

    return rows.map(
      mapProfileRow
    );
  },

  /* =======================================================
   * UPDATE USER ACTIVE STATUS
   * ===================================================== */

  async setUserActiveStatus(
    userId: string,
    isActive: boolean
  ): Promise<void> {
    if (!userId) {
      throw new Error(
        'ไม่พบรหัสสมาชิก'
      );
    }

    /*
     * ตรวจข้อมูลสมาชิกก่อน
     */
    const user =
      await this.getUserById(
        userId
      );

    if (!user) {
      throw new Error(
        'ไม่พบข้อมูลสมาชิก'
      );
    }

    /*
     * ไม่ให้เปิด/ปิดบัญชี ADMIN
     * จากหน้า User Management ทั่วไป
     */
    if (
      user.role === 'ADMIN'
    ) {
      throw new Error(
        'ไม่สามารถเปลี่ยนสถานะบัญชีผู้ดูแลระบบจากเมนูนี้ได้'
      );
    }

    const {
      error,
    } = await supabase
      .from('profiles')
      .update({
        is_active:
          isActive,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        userId
      );

    if (error) {
      console.error(
        'UPDATE USER ACTIVE STATUS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถเปลี่ยนสถานะบัญชีได้'
      );
    }
  },

  /* =======================================================
   * ACTIVATE USER
   * ===================================================== */

  async activateUser(
    userId: string
  ): Promise<void> {
    await this.setUserActiveStatus(
      userId,
      true
    );
  },

  /* =======================================================
   * DEACTIVATE USER
   * ===================================================== */

  async deactivateUser(
    userId: string
  ): Promise<void> {
    await this.setUserActiveStatus(
      userId,
      false
    );
  },

  /* =======================================================
   * GET USER STATS
   * ===================================================== */

  async getUserStats(): Promise<AdminUserStats> {
    const users =
      await this.getUsers();

    let owners = 0;
    let sitters = 0;
    let admins = 0;

    let active = 0;
    let inactive = 0;

    for (
      const user of
      users
    ) {
      if (
        user.role ===
        'OWNER'
      ) {
        owners += 1;
      }

      if (
        user.role ===
        'SITTER'
      ) {
        sitters += 1;
      }

      if (
        user.role ===
        'ADMIN'
      ) {
        admins += 1;
      }

      if (
        user.isActive
      ) {
        active += 1;
      } else {
        inactive += 1;
      }
    }

    return {
      total:
        users.length,

      owners,
      sitters,
      admins,

      active,
      inactive,
    };
  },
};