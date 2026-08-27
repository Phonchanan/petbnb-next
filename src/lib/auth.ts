import { supabase } from '@/lib/supabase/client';

export type UserRole = 'OWNER' | 'SITTER' | 'ADMIN';

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  role: 'OWNER' | 'SITTER';
}

export interface CurrentProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email: string;
}

export const AuthService = {
  async signUp(input: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          display_name:
            input.displayName ||
            `${input.firstName} ${input.lastName}`,
          phone: input.phone || null,
          role: input.role,
        },
      },
    });

    if (error) {
      console.error('SIGNUP ERROR:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error('SIGNIN ERROR:', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error(
        'ไม่พบข้อมูลผู้ใช้งานหลังเข้าสู่ระบบ'
      );
    }

    return data;
  },

  async signOut() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        'SIGNOUT ERROR:',
        error
      );

      throw new Error(
        error.message
      );
    }
  },

  async getCurrentProfile(): Promise<CurrentProfile | null> {
    // เช็ก session ก่อน
    // ถ้ายังไม่ได้ login จะ return null
    // แทนการ throw AuthSessionMissingError
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'GET SESSION ERROR:',
        sessionError
      );

      return null;
    }

    if (!session?.user) {
      return null;
    }

    const user = session.user;

    const { data: profile, error } =
      await supabase
        .from('profiles')
        .select(
          `
          id,
          first_name,
          last_name,
          display_name,
          phone,
          avatar_url,
          bio,
          role,
          is_active,
          created_at,
          updated_at
          `
        )
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
      console.error(
        'GET PROFILE ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้'
      );
    }

    if (!profile) {
      throw new Error(
        `ไม่พบ profile สำหรับ user id: ${user.id}`
      );
    }

    return {
      id: profile.id,
      first_name:
        profile.first_name,
      last_name:
        profile.last_name,
      display_name:
        profile.display_name,
      phone:
        profile.phone,
      avatar_url:
        profile.avatar_url,
      bio:
        profile.bio,
      role:
        profile.role as UserRole,
      is_active:
        profile.is_active,
      created_at:
        profile.created_at,
      updated_at:
        profile.updated_at,
      email:
        user.email || '',
    };
  },
};