/* eslint-disable @next/next/no-img-element */
'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  PawPrint,
  UserRound,
} from 'lucide-react';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

const menuItems = [
  {
    label: 'ภาพรวม',
    href: '/sitter',
    icon: LayoutDashboard,
  },
  {
    label: 'คำขอจอง',
    href: '/sitter/bookings',
    icon: CalendarDays,
  },
  {
    label: 'บริการของฉัน',
    href: '/sitter/services',
    icon: PawPrint,
  },
  {
    label: 'โปรไฟล์ผู้รับฝาก',
    href: '/sitter/profile',
    icon: UserRound,
  },
];

export default function SitterNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const current =
          await AuthService.getCurrentProfile();

        setProfile(current);
      } catch (error) {
        console.error(
          'LOAD SITTER NAV PROFILE ERROR:',
          error
        );
      }
    };

    void loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.signOut();

      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error(
        'SITTER LOGOUT ERROR:',
        error
      );

      alert(
        'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง'
      );
    }
  };

  const getUserName = () => {
    if (!profile) {
      return 'ผู้รับฝาก';
    }

    if (
      profile.display_name &&
      profile.display_name.trim()
    ) {
      return profile.display_name;
    }

    const fullName = [
      profile.first_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || 'ผู้รับฝาก';
  };

  const isActive = (
    href: string
  ) =>
    href === '/sitter'
      ? pathname === '/sitter'
      : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-purple-100/70 bg-[#FCFAFF]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* LOGO */}
        <Link
          href="/sitter"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_8px_20px_rgba(124,58,237,0.22)] transition group-hover:scale-[1.03]">
            <Home className="h-4.5 w-4.5" />
          </div>

          <div>
            <p className="text-[17px] font-black leading-none tracking-tight text-purple-950">
              PetBnB
            </p>

            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-purple-400">
              Sitter Space
            </p>
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-[18px] bg-purple-50/80 p-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                item.href
              );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-[11px] font-black transition ${
                    active
                      ? 'bg-white text-purple-700 shadow-[0_5px_16px_rgba(76,29,149,0.08)]'
                      : 'text-slate-500 hover:bg-white/70 hover:text-purple-700'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active
                        ? 'text-purple-600'
                        : 'text-slate-400'
                    }`}
                  />

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* USER */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/sitter/profile"
            className="group flex items-center gap-2.5 rounded-[18px] px-2 py-1.5 transition hover:bg-purple-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 ring-2 ring-white">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={getUserName()}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-4 w-4" />
              )}
            </div>

            <div className="hidden max-w-[130px] xl:block">
              <p className="truncate text-[11px] font-black text-purple-950">
                {getUserName()}
              </p>

              <p className="mt-0.5 text-[8px] font-bold text-slate-400">
                ผู้รับฝากสัตว์เลี้ยง
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 xl:w-auto xl:gap-2 xl:px-3"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4" />

            <span className="hidden text-[10px] font-black xl:inline">
              ออกจากระบบ
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className="overflow-x-auto border-t border-purple-100/60 bg-white/70 lg:hidden">
        <nav className="flex min-w-max gap-1 px-4 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(
              item.href
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-black transition ${
                  active
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
