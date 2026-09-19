'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  PawPrint,
  Search,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Plus,
  Clock3,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

import { OwnerService } from '@/lib/supabase/ownerService';
import { supabase } from '@/lib/supabase/client';

interface PetRow {
  id: string;
  name: string;
  category_id: string;
  breed: string | null;
  gender: string | null;
  weight: number | null;
  photo_url: string | null;
  behavior_notes: string | null;
  created_at: string;
}

interface OwnerBookingItem {
  id: string;
  bookingCode: string | null;
  petName: string;
  sitterName: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  paymentStatus: string | null;
  escrowStatus: string | null;
}

interface OwnerActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}

interface BookingQueryRow {
  id: string;
  booking_code: string | null;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number | string;
  pet: { name: string } | { name: string }[] | null;
  sitter:
    | {
        profiles:
          | { display_name: string | null; first_name: string | null; last_name: string | null }
          | { display_name: string | null; first_name: string | null; last_name: string | null }[]
          | null;
      }
    | {
        profiles:
          | { display_name: string | null; first_name: string | null; last_name: string | null }
          | { display_name: string | null; first_name: string | null; last_name: string | null }[]
          | null;
      }[]
    | null;
}

const initialBookingStats = {
  pending: 0,
  awaitingPayment: 0,
  inProgress: 0,
  completed: 0,
};

export default function OwnerPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [petCount, setPetCount] =
    useState(0);

  const [pets, setPets] =
    useState<PetRow[]>([]);

  const [bookingStats, setBookingStats] =
    useState(initialBookingStats);

  const [recentBookings, setRecentBookings] =
    useState<OwnerBookingItem[]>([]);

  const [actionItems, setActionItems] =
    useState<OwnerActionItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const currentProfile =
          await AuthService.getCurrentProfile();

        if (!currentProfile) {
          router.replace('/login');
          return;
        }

        if (
          currentProfile.is_active === false
        ) {
          await AuthService.signOut();
          router.replace('/login');
          return;
        }

        if (
          currentProfile.role.toUpperCase() !==
          'OWNER'
        ) {
          if (
            currentProfile.role.toUpperCase() ===
            'SITTER'
          ) {
            router.replace('/sitter');
          } else {
            router.replace('/admin');
          }

          return;
        }

        setProfile(currentProfile);

        const [count, recentPets, bookingData] =
          await Promise.all([
            OwnerService.getPetCount(
              currentProfile.id
            ),
            OwnerService.getRecentPets(
              currentProfile.id
            ),
            getOwnerDashboardBookings(
              currentProfile.id
            ),
          ]);

        setPetCount(count);

        setPets(
          recentPets as PetRow[]
        );

        setBookingStats(bookingData.stats);
        setRecentBookings(bookingData.items);
        setActionItems(bookingData.actions);
      } catch (err) {
        console.error(
          'OWNER DASHBOARD ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถโหลดข้อมูลได้'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-5 animate-pulse">
          <div className="h-28 rounded-[28px] bg-purple-100" />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-3xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const ownerName =
    profile.display_name ||
    `${profile.first_name ?? ''} ${
      profile.last_name ?? ''
    }`.trim() ||
    'เจ้าของสัตว์เลี้ยง';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-5 sm:space-y-6">
        <section className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
              PetBnB Owner
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-purple-950 sm:text-3xl">
              Dashboard
            </h1>
          </div>
        </section>

        {/* Welcome */}
        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:p-7">
          <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-purple-200/40 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-pink-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-black text-purple-700 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Owner Dashboard
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[#2E1065] sm:text-3xl">
                สวัสดีคุณ {ownerName} 👋
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                จัดการข้อมูลสัตว์เลี้ยง
                ค้นหาผู้รับฝากที่เหมาะสม
                และติดตามการจองของคุณได้จากที่นี่
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/owner/search" className="inline-flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition hover:bg-purple-700">
                  ค้นหาผู้รับฝาก
                  <Search className="h-3.5 w-3.5" />
                </Link>
                <Link href="/owner/bookings" className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-[11px] font-black text-purple-700 transition hover:bg-white">
                  ดูการจองของฉัน
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* Overview */}
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-black text-[#2E1065] sm:text-base">
              ภาพรวม
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              ข้อมูลสำคัญจากบัญชีของคุณ
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <DashboardCard
              icon={<Clock3 className="h-4 w-4" />}
              title="คำขอรอตอบรับ"
              value={String(bookingStats.pending)}
              description="รอผู้รับฝากตอบรับ"
              iconClass="bg-[#FFF6D8] text-amber-700"
            />

            <DashboardCard
              icon={<CalendarDays className="h-4 w-4" />}
              title="รอชำระเงิน"
              value={String(bookingStats.awaitingPayment)}
              description="ตรวจสอบการชำระเงิน"
              iconClass="bg-[#F1E8FF] text-purple-700"
            />

            <DashboardCard
              icon={<PawPrint className="h-4 w-4" />}
              title="กำลังรับบริการ"
              value={String(bookingStats.inProgress)}
              description="อยู่ระหว่างการดูแล"
              iconClass="bg-[#E8F8EF] text-emerald-700"
            />

            <DashboardCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="เสร็จสิ้น"
              value={String(bookingStats.completed)}
              description={`${petCount} สัตว์เลี้ยงในบัญชี`}
              iconClass="bg-[#FFEAF2] text-rose-700"
            />
          </div>
        </section>

        {actionItems.length > 0 && (
          <section className="rounded-[28px] bg-[#FFF9F0] p-5 shadow-[0_8px_30px_rgba(76,29,149,0.04)] sm:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500">
                Action Required
              </p>
              <h2 className="mt-1 font-black text-purple-950">
                สิ่งที่ต้องดำเนินการ
              </h2>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {actionItems.slice(0, 4).map((action) => (
                <div key={action.id} className="flex items-center justify-between gap-4 rounded-[20px] bg-white p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-purple-950">{action.title}</p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-400">{action.description}</p>
                  </div>
                  <Link href={action.href} className="shrink-0 rounded-xl bg-purple-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-purple-700">
                    {action.buttonLabel}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent bookings */}
        <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-400">
                Recent Bookings
              </p>
              <h2 className="mt-1 font-black text-purple-950">
                การจองล่าสุด
              </h2>
            </div>
            <Link href="/owner/bookings" className="inline-flex items-center gap-1 text-[10px] font-black text-purple-600">
              ดูทั้งหมด
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentBookings.length > 0 ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/owner/bookings/${booking.id}`}
                  className="rounded-[22px] bg-[#F8F4FF] p-4 transition hover:bg-purple-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-purple-950">
                        {booking.petName}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        ผู้รับฝาก: {booking.sitterName}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </div>

                  <p className="mt-3 text-[10px] text-slate-500">
                    {formatShortDate(booking.startDate)} - {formatShortDate(booking.endDate)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400">
                      <CreditCard className="h-3.5 w-3.5" />
                      {getPaymentLabel(booking.paymentStatus, booking.status)}
                    </span>
                    <span className="text-xs font-black text-purple-700">
                      {formatMoney(booking.totalPrice)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] bg-[#F8F4FF] p-8 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-purple-300" />
              <p className="mt-3 text-sm font-black text-purple-950">ยังไม่มีการจอง</p>
              <Link href="/owner/search" className="mt-3 inline-flex items-center gap-1 rounded-2xl bg-purple-600 px-4 py-2 text-[10px] font-black text-white">
                ค้นหาผู้รับฝาก
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </section>

        <div>
          {/* Pets */}
          <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.05)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-[#2E1065]">
                  สัตว์เลี้ยงของฉัน
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  ข้อมูลล่าสุดจาก Supabase
                </p>
              </div>

              <Link
                href="/owner/pets"
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline"
              >
                ดูทั้งหมด
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/40 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                  <PawPrint className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  ยังไม่มีสัตว์เลี้ยงในบัญชี
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  เพิ่มข้อมูลสัตว์เลี้ยงเพื่อเริ่มใช้งาน PetBnB
                </p>

                <Link
                  href="/owner/pets"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มสัตว์เลี้ยง
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="flex items-center gap-3 rounded-[20px] border border-purple-100 bg-[#FCFAFF] p-3.5 transition hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50/60"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-purple-100 text-2xl">
                      {pet.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pet.photo_url}
                          alt={pet.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        '🐾'
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-purple-950">
                        {pet.name}
                      </div>

                      <div className="mt-0.5 truncate text-[11px] text-slate-500">
                        {pet.breed ||
                          pet.category_id}
                      </div>

                      {pet.behavior_notes && (
                        <div className="mt-1 truncate text-[10px] text-purple-600">
                          {pet.behavior_notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

async function getOwnerDashboardBookings(ownerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
      start_date,
      end_date,
      status,
      total_price,
      pet:pets!bookings_pet_id_fkey (name),
      sitter:sitter_profiles!bookings_sitter_id_fkey (
        profiles (display_name, first_name, last_name)
      )
    `)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as BookingQueryRow[];
  const ids = rows.map((row) => row.id);
  const paymentMap = new Map<
    string,
    { paymentStatus: string; escrowStatus: string | null }
  >();

  if (ids.length > 0) {
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('booking_id, payment_status, escrow_status')
      .in('booking_id', ids);

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    (payments ?? []).forEach((payment) => {
      paymentMap.set(payment.booking_id, {
        paymentStatus: payment.payment_status ?? 'PENDING',
        escrowStatus: payment.escrow_status,
      });
    });
  }

  const stats = rows.reduce(
    (result, row) => ({
      pending: result.pending + (row.status === 'PENDING' ? 1 : 0),
      awaitingPayment:
        result.awaitingPayment +
        (row.status === 'CONFIRMED' &&
        paymentMap.get(row.id)?.paymentStatus !== 'PAID'
          ? 1
          : 0),
      inProgress: result.inProgress + (row.status === 'IN_PROGRESS' ? 1 : 0),
      completed: result.completed + (row.status === 'COMPLETED' ? 1 : 0),
    }),
    { ...initialBookingStats }
  );

  const priority: Record<string, number> = {
    IN_PROGRESS: 0,
    CONFIRMED: 1,
    PENDING: 2,
    COMPLETED: 3,
  };

  const items = [...rows]
    .sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9))
    .slice(0, 3)
    .map((row): OwnerBookingItem => {
      const pet = Array.isArray(row.pet) ? row.pet[0] ?? null : row.pet;
      const sitter = Array.isArray(row.sitter) ? row.sitter[0] ?? null : row.sitter;
      const sitterProfile = sitter
        ? Array.isArray(sitter.profiles)
          ? sitter.profiles[0] ?? null
          : sitter.profiles
        : null;
      const sitterName = sitterProfile?.display_name?.trim()
        || [sitterProfile?.first_name, sitterProfile?.last_name].filter(Boolean).join(' ').trim()
        || 'ผู้รับฝากสัตว์เลี้ยง';

      return {
        id: row.id,
        bookingCode: row.booking_code,
        petName: pet?.name ?? 'สัตว์เลี้ยง',
        sitterName,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        totalPrice: Number(row.total_price ?? 0),
        paymentStatus:
          paymentMap.get(row.id)?.paymentStatus ?? null,
        escrowStatus:
          paymentMap.get(row.id)?.escrowStatus ?? null,
      };
    });

  const actions: OwnerActionItem[] = rows
    .flatMap((row) => {
      const payment = paymentMap.get(row.id);
      const pet = Array.isArray(row.pet)
        ? row.pet[0] ?? null
        : row.pet;
      const bookingLabel = pet?.name ?? row.booking_code ?? 'การจอง';

      if (
        row.status === 'CONFIRMED' &&
        payment?.paymentStatus !== 'PAID'
      ) {
        return [{
          id: `payment-${row.id}`,
          title: `ชำระเงินสำหรับ ${bookingLabel}`,
          description: 'ผู้รับฝากตอบรับแล้ว กรุณาชำระเงินเพื่อยืนยันการจอง',
          href: `/owner/bookings/${row.id}/payment`,
          buttonLabel: 'ชำระเงิน',
        }];
      }

      if (
        row.status === 'COMPLETED' &&
        payment?.paymentStatus === 'PAID' &&
        payment.escrowStatus === 'HELD'
      ) {
        return [{
          id: `complete-${row.id}`,
          title: `ยืนยันการรับ ${bookingLabel} กลับแล้ว`,
          description: 'ผู้รับฝากแจ้งว่าการให้บริการเสร็จสิ้นแล้ว',
          href: `/owner/bookings/${row.id}`,
          buttonLabel: 'ตรวจสอบ',
        }];
      }

      return [];
    });

  return { stats, items, actions };
}

function BookingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'รอตอบรับ', className: 'bg-amber-100 text-amber-700' },
    CONFIRMED: { label: 'ยืนยันแล้ว', className: 'bg-blue-100 text-blue-700' },
    IN_PROGRESS: { label: 'กำลังดูแล', className: 'bg-purple-100 text-purple-700' },
    COMPLETED: { label: 'เสร็จสิ้น', className: 'bg-emerald-100 text-emerald-700' },
  };
  const current = styles[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black ${current.className}`}>{current.label}</span>;
}

function getPaymentLabel(paymentStatus: string | null, bookingStatus: string) {
  if (paymentStatus === 'PAID') return bookingStatus === 'COMPLETED' ? 'รายการเสร็จสมบูรณ์' : 'ชำระเงินแล้ว';
  if (paymentStatus === 'REFUNDED') return 'คืนเงินแล้ว';
  if (paymentStatus === 'FAILED') return 'ชำระไม่สำเร็จ';
  return bookingStatus === 'CONFIRMED' ? 'รอชำระเงิน' : 'ยังไม่มีรายการชำระเงิน';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(date);
}

function DashboardCard({
  icon,
  title,
  value,
  description,
  iconClass,
  wideOnMobile = false,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
  iconClass: string;
  wideOnMobile?: boolean;
}) {
  return (
    <div className={`rounded-[22px] border border-purple-100 bg-white p-4 shadow-sm sm:p-5 ${wideOnMobile ? "col-span-2 lg:col-span-1" : ""}`}>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div className="mt-3 text-[11px] font-bold text-slate-500">
        {title}
      </div>

      <div className="mt-1 text-lg font-black text-[#2E1065] sm:text-xl">
        {value}
      </div>

      <div className="mt-1 text-[10px] leading-4 text-slate-400">
        {description}
      </div>
    </div>
  );
}

