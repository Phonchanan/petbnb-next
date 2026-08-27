'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  PawPrint,
  Search,
  CalendarDays,
  Heart,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Plus,
} from 'lucide-react';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

import { OwnerService } from '@/lib/supabase/ownerService';

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

export default function OwnerPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [petCount, setPetCount] =
    useState(0);

  const [pets, setPets] =
    useState<PetRow[]>([]);

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

        const [count, recentPets] =
          await Promise.all([
            OwnerService.getPetCount(
              currentProfile.id
            ),
            OwnerService.getRecentPets(
              currentProfile.id
            ),
          ]);

        setPetCount(count);

        setPets(
          recentPets as PetRow[]
        );
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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-6">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-4xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-purple-100/80 blur-2xl" />

          <div className="absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-pink-100 blur-2xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
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
            </div>

            <Link
              href="/owner/pets"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              เพิ่มสัตว์เลี้ยง
            </Link>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <DashboardCard
            icon={<PawPrint className="h-5 w-5" />}
            title="สัตว์เลี้ยงของฉัน"
            value={`${petCount} ตัว`}
            description="ข้อมูลจากบัญชีของคุณ"
            iconClass="bg-pink-100 text-pink-600"
          />

          <DashboardCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="การจอง"
            value="—"
            description="เชื่อมข้อมูลในขั้น Booking"
            iconClass="bg-purple-100 text-purple-600"
          />

          <DashboardCard
            icon={<Heart className="h-5 w-5" />}
            title="รายการโปรด"
            value="—"
            description="ยังไม่มีข้อมูล Favorite จริง"
            iconClass="bg-amber-100 text-amber-600"
          />

          <DashboardCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="บัญชี"
            value="พร้อมใช้งาน"
            description="ยืนยันผ่าน Supabase Auth"
            iconClass="bg-emerald-100 text-emerald-600"
          />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pets */}
          <section className="lg:col-span-2 rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
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
                    className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-[#FAF7FE]/60 p-4"
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

          {/* Quick actions */}
          <section className="rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="font-extrabold text-[#2E1065]">
              เมนูลัด
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              เริ่มต้นใช้งานได้อย่างรวดเร็ว
            </p>

            <div className="mt-5 space-y-3">
              <QuickLink
                href="/owner/pets"
                icon={<PawPrint className="h-4 w-4" />}
                title="จัดการสัตว์เลี้ยง"
                description="เพิ่มและแก้ไขข้อมูลน้องๆ"
              />

              <QuickLink
                href="/"
                icon={<Search className="h-4 w-4" />}
                title="ค้นหาผู้รับฝาก"
                description="ค้นหาผู้ดูแลที่เหมาะสม"
              />

              <QuickLink
                href="/owner/bookings"
                icon={<CalendarDays className="h-4 w-4" />}
                title="การจองของฉัน"
                description="ตรวจสอบสถานะคำขอ"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  description,
  iconClass,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${iconClass}`}
      >
        {icon}
      </div>

      <div className="text-xs font-bold text-slate-500">
        {title}
      </div>

      <div className="mt-1 text-xl font-black text-[#2E1065]">
        {value}
      </div>

      <div className="mt-1 text-[10px] text-slate-400">
        {description}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-[#FAF7FE] p-3.5 transition hover:border-purple-300 hover:bg-purple-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-800">
          {title}
        </div>

        <div className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </div>
      </div>

      <ArrowRight className="h-3.5 w-3.5 text-purple-400" />
    </Link>
  );
}