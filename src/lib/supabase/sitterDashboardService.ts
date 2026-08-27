import { supabase } from '@/lib/supabase/client';

export interface SitterDashboardStats {
  pendingCount: number;
  confirmedCount: number;
  inProgressCount: number;
  completedCount: number;
  totalRevenue: number;
}

interface BookingSummaryRow {
  status: string;
  total_price: number | string;
}

export const SitterDashboardService = {
  async getStats(
    sitterProfileId: string
  ): Promise<SitterDashboardStats> {
    if (!sitterProfileId) {
      return {
        pendingCount: 0,
        confirmedCount: 0,
        inProgressCount: 0,
        completedCount: 0,
        totalRevenue: 0,
      };
    }

    const { data, error } =
      await supabase
        .from('bookings')
        .select(`
          status,
          total_price
        `)
        .eq(
          'sitter_id',
          sitterProfileId
        );

    if (error) {
      console.error(
        'GET SITTER DASHBOARD STATS ERROR:',
        error
      );

      throw new Error(
        error.message ||
          'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้'
      );
    }

    const rows =
      (data ?? []) as BookingSummaryRow[];

    const pendingCount =
      rows.filter(
        (item) =>
          item.status === 'PENDING'
      ).length;

    const confirmedCount =
      rows.filter(
        (item) =>
          item.status === 'CONFIRMED'
      ).length;

    const inProgressCount =
      rows.filter(
        (item) =>
          item.status === 'IN_PROGRESS'
      ).length;

    const completedBookings =
      rows.filter(
        (item) =>
          item.status === 'COMPLETED'
      );

    const completedCount =
      completedBookings.length;

    const totalRevenue =
      completedBookings.reduce(
        (sum, item) =>
          sum +
          Number(
            item.total_price
          ),
        0
      );

    return {
      pendingCount,
      confirmedCount,
      inProgressCount,
      completedCount,
      totalRevenue,
    };
  },
};