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
  LayoutDashboard,
  LogOut,
  PawPrint,
  Search,
  UserRound,
} from 'lucide-react';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

const menuItems = [
  {
    label: 'ภาพรวม',
    href: '/owner',
    icon: LayoutDashboard,
  },
  {
    label: 'ค้นหาผู้รับฝาก',
    href: '/owner/search',
    icon: Search,
  },
  {
    label: 'สัตว์เลี้ยงของฉัน',
    href: '/owner/pets',
    icon: PawPrint,
  },
  {
    label: 'การจอง',
    href: '/owner/bookings',
    icon: CalendarDays,
  },
  {
    label: 'โปรไฟล์',
    href: '/owner/profile',
    icon: UserRound,
  },
];

export default function OwnerNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentProfile =
          await AuthService.getCurrentProfile();

        setProfile(currentProfile);
      } catch (error) {
        console.error(
          'LOAD NAV PROFILE ERROR:',
          error
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.signOut();

      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error
      );

      alert(
        'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง'
      );
    }
  };

  const getUserName = () => {
    if (!profile) {
      return 'ผู้ใช้งาน';
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

    if (fullName) {
      return fullName;
    }

    return 'ผู้ใช้งาน';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-purple-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/owner"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-200">
            <PawPrint className="h-5 w-5" />
          </div>

          <div>
            <div className="text-lg font-black leading-none text-purple-950">
              PetBnB
            </div>

            <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-purple-400">
              Pet Owner
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === '/owner'
                ? pathname === '/owner'
                : pathname.startsWith(
                    item.href
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />

                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="flex shrink-0 items-center gap-2">

          {/* User Profile */}
          <Link
            href="/owner/profile"
            className="flex items-center gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-purple-50"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-100 text-purple-600">
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

            {/* Name */}
            <div className="hidden max-w-32.5 xl:block">
              <p className="truncate text-xs font-bold text-purple-950">
                {loadingProfile
                  ? 'กำลังโหลด...'
                  : getUserName()}
              </p>

              <p className="text-[9px] text-slate-400">
                เจ้าของสัตว์เลี้ยง
              </p>
            </div>
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="ออกจากระบบ"
            className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-white px-3 text-xs font-bold text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />

            <span className="hidden 2xl:inline">
              ออกจากระบบ
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="overflow-x-auto border-t border-purple-50 lg:hidden">
        <nav className="mx-auto flex min-w-max items-center gap-1 px-4 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === '/owner'
                ? pathname === '/owner'
                : pathname.startsWith(
                    item.href
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold ${
                  active
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-500'
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