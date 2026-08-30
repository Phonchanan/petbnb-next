"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  Heart,
  Headphones,
  MapPin,
  Menu,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";

const petCategories = [
  {
    id: "SMALL_MAMMALS",
    name: "สัตว์เลี้ยงลูกด้วยนมขนาดเล็ก",
    description:
      "กระต่าย แฮมสเตอร์ แกสบี้ ชูการ์ไกลเดอร์ เม่นแคระ และชินชิล่า",
    image: "/images/category-small-pets.png",
    tone: "from-[#F9F4FF] to-[#FCF8FF]",
    border: "border-violet-200",
    title: "text-violet-700",
    button: "bg-violet-500",
  },
  {
    id: "CANINE_FELINE",
    name: "สุนัขและแมว",
    description:
      "สุนัขและแมวหลากหลายสายพันธุ์ โดยผู้รับฝากที่ผ่านการตรวจสอบ",
    image: "/images/category-dog-cat.png",
    tone: "from-[#FFF5F8] to-[#FFF9FA]",
    border: "border-pink-200",
    title: "text-pink-600",
    button: "bg-pink-500",
  },
  {
    id: "REPTILES_AMPHIBIANS_AQUATICS",
    name: "สัตว์เลื้อยคลานและสัตว์น้ำ",
    description:
      "งูเลี้ยง เบียร์ดดราก้อน เกคโค เต่า กบ และปลาสวยงาม",
    image: "/images/category-exotic.png",
    tone: "from-[#F4FBF7] to-[#F9FCFA]",
    border: "border-emerald-200",
    title: "text-emerald-700",
    button: "bg-emerald-600",
  },
  {
    id: "ORNAMENTAL_BIRDS_AVIANS",
    name: "นกและสัตว์ปีกสวยงาม",
    description:
      "ค็อกคาเทล คอนัวร์ เลิฟเบิร์ด หงส์หยก และนกสวยงาม",
    image: "/images/category-birds.png",
    tone: "from-[#F4F7FF] to-[#FAFBFF]",
    border: "border-blue-200",
    title: "text-blue-700",
    button: "bg-blue-500",
  },
];

const topFeatures = [
  {
    icon: ShieldCheck,
    title: "ผู้รับฝากผ่านการตรวจสอบ",
    description:
      "ตรวจสอบข้อมูลและเอกสารยืนยันตัวตนก่อนเปิดให้บริการ",
    iconClass: "bg-violet-50 text-violet-600",
  },
  {
    icon: BadgeCheck,
    title: "มีแบบทดสอบความรู้",
    description:
      "Sitter ต้องผ่านแบบทดสอบพื้นฐานและตามประเภทสัตว์ที่รับดูแล",
    iconClass: "bg-pink-50 text-pink-500",
  },
  {
    icon: MapPin,
    title: "ค้นหาในพื้นที่",
    description:
      "ค้นหาผู้รับฝากตามพื้นที่ให้บริการที่คุณต้องการ",
    iconClass: "bg-violet-50 text-violet-600",
  },
  {
    icon: CalendarCheck2,
    title: "จัดการการจองง่าย",
    description:
      "ส่งคำขอฝากเลี้ยงและติดตามสถานะได้ภายในระบบ",
    iconClass: "bg-rose-50 text-rose-500",
  },
];

const whyItems = [
  {
    icon: Heart,
    title: "ดูแลได้เหมือนอยู่บ้าน",
    description: "Sitter ทุกคนรักสัตว์และดูแลอย่างใกล้ชิด",
  },
  {
    icon: Camera,
    title: "อัปเดตทุกวัน",
    description: "ส่งรูปและอัปเดตความเป็นอยู่ของน้อง",
  },
  {
    icon: ShieldCheck,
    title: "ปลอดภัย มั่นใจได้",
    description: "ระบบตรวจสอบและรีวิวจากผู้ใช้จริง",
  },
  {
    icon: Headphones,
    title: "ทีมงานพร้อมช่วยเหลือ",
    description: "พร้อมดูแลและช่วยเหลือคุณตลอดการใช้งาน",
  },
];

const ownerSteps = [
  {
    no: "01",
    title: "เพิ่มข้อมูลสัตว์เลี้ยง",
    description:
      "บันทึกข้อมูลพื้นฐาน พฤติกรรม อาหาร และข้อมูลที่จำเป็น",
    icon: UserRound,
    box: "bg-[#F5EEFF]",
    accent: "text-violet-600",
  },
  {
    no: "02",
    title: "ค้นหา Sitter",
    description:
      "ค้นหาและเลือกผู้รับฝากที่ตรงกับประเภทสัตว์และพื้นที่",
    icon: Search,
    box: "bg-[#FFF0F6]",
    accent: "text-pink-500",
  },
  {
    no: "03",
    title: "ส่งคำขอจอง",
    description:
      "เลือกวันที่และบริการ จากนั้นส่งคำขอไปยัง Sitter",
    icon: CalendarCheck2,
    box: "bg-[#FFF7E9]",
    accent: "text-amber-500",
  },
  {
    no: "04",
    title: "ติดตามสถานะ",
    description:
      "ตรวจสอบสถานะและติดตามการดูแลสัตว์เลี้ยง",
    icon: CheckCircle2,
    box: "bg-[#EEF4FF]",
    accent: "text-blue-500",
  },
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#FEFDFF] text-slate-800">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-purple-100/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1460px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <PawPrint className="h-4.5 w-4.5" />
            </div>

            <span className="text-[22px] font-black tracking-tight text-violet-700">
              PetBnB
            </span>

            <Heart className="-ml-1 h-3.5 w-3.5 fill-pink-400 text-pink-400" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#home" className="text-xs font-black text-violet-700">
              หน้าแรก
            </a>
            <a
              href="#categories"
              className="text-xs font-semibold text-slate-600 transition hover:text-violet-700"
            >
              ประเภทสัตว์
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-semibold text-slate-600 transition hover:text-violet-700"
            >
              วิธีใช้งาน
            </a>
            <a
              href="#why-petbnb"
              className="text-xs font-semibold text-slate-600 transition hover:text-violet-700"
            >
              เกี่ยวกับเรา
            </a>
           
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-violet-200 bg-white px-5 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 sm:inline-flex"
            >
              เข้าสู่ระบบ
            </Link>

            <Link
              href="/signup"
              className="inline-flex rounded-full bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
            >
              สมัครสมาชิก
            </Link>

            <button
              type="button"
              aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-white text-violet-700 transition hover:bg-violet-50 lg:hidden"
            >
              <Menu
                className={`h-4.5 w-4.5 transition-transform duration-200 ${
                  mobileMenuOpen ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-purple-100 bg-white px-4 pb-4 pt-3 shadow-lg lg:hidden"
          >
            <nav className="mx-auto flex max-w-[1460px] flex-col gap-1">
              <a
                href="#home"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
              >
                หน้าแรก
              </a>

              <a
                href="#categories"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                ประเภทสัตว์
              </a>

              <a
                href="#how-it-works"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                วิธีใช้งาน
              </a>

              <a
                href="#why-petbnb"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                เกี่ยวกับเรา
              </a>


              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-purple-100 pt-3 sm:hidden">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-violet-200 bg-white text-sm font-bold text-violet-700"
                >
                  เข้าสู่ระบบ
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section id="home" className="pt-4">
        <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8">
          <div className="relative min-h-[515px] overflow-hidden rounded-[30px] border border-purple-100 bg-white shadow-[0_16px_42px_rgba(88,28,135,0.10)]">
            <img
              src="/images/petbnb-home-banner.png"
              alt="PetBnB Sitter ดูแลสัตว์เลี้ยง"
              className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
            />

            {/* ไล่พื้นขาวทางซ้ายให้ข้อความอ่านง่าย เหมือนภาพตัวอย่าง */}
            <div className="absolute inset-0 bg-linear-to-r from-white from-[0%] via-white/96 via-[38%] to-transparent to-[68%]" />

            <div className="relative mx-auto flex min-h-[515px] items-center px-7 py-9 sm:px-10 lg:px-12 xl:px-14">
              <div className="w-full max-w-[560px]">
                <div className="flex items-center gap-2">
                  <h1 className="text-[48px] font-black tracking-tight text-violet-700 sm:text-[58px] lg:text-[64px]">
                    PetBnB
                  </h1>

                  <Heart className="h-6 w-6 fill-pink-400 text-pink-400" />
                </div>

                <h2 className="mt-3 text-[30px] font-black leading-[1.14] text-violet-800 sm:text-[38px] lg:text-[43px]">
                  บ้านพักแสนอบอุ่น
                  <span className="mt-1 block text-slate-700">
                    สำหรับ{" "}
                    <span className="text-pink-500">
                      สัตว์เลี้ยงของคุณ
                    </span>
                  </span>
                </h2>

                <div className="my-5 flex max-w-[430px] items-center gap-3">
                  <div className="h-px flex-1 bg-purple-100" />
                  <Heart className="h-3.5 w-3.5 fill-pink-300 text-pink-300" />
                  <div className="h-px flex-1 bg-purple-100" />
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    <Heart className="h-4.5 w-4.5" />
                  </div>

                  <p className="text-[12.5px] leading-5.5 text-slate-600">
                    ค้นหาผู้รับฝากที่ไว้ใจได้
                    <br />
                    ดูแลใส่ใจในทุกประเภทสัตว์เลี้ยง
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-600 px-7 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
                  >
                    <Search className="h-4 w-4" />
                    ค้นหาผู้รับฝาก
                  </Link>

                  <Link
                    href="/signup?role=SITTER"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-pink-500 px-7 text-xs font-bold text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:bg-pink-600"
                  >
                    <UserRound className="h-4 w-4" />
                    สมัครเป็น Sitter
                  </Link>
                </div>

                <div className="mt-7 grid max-w-[455px] grid-cols-2 gap-4 sm:grid-cols-4">
                  <HeroTrust icon={ShieldCheck} label="ปลอดภัย ไว้ใจได้" />
                  <HeroTrust icon={Heart} label="ดูแลด้วยความรัก" />
                  <HeroTrust icon={Camera} label="อัปเดตทุกวัน" />
                  <HeroTrust icon={Star} label="รีวิวจากผู้ใช้จริง" />
                </div>
              </div>
            </div>

            <div className="absolute right-5 top-5 hidden rounded-full border border-violet-100 bg-white/92 px-4 py-2 shadow-md backdrop-blur sm:block">
              <div className="flex items-center gap-2 text-[10.5px] font-bold text-violet-700">
                <BadgeCheck className="h-4 w-4" />
                Sitter ตรวจสอบแล้ว
                <CheckCircle2 className="h-4 w-4 text-violet-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURE STRIP ================= */}
      <section className="pt-3">
        <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[24px] border border-purple-100 bg-white shadow-[0_10px_28px_rgba(88,28,135,0.08)] sm:grid-cols-2 lg:grid-cols-4">
            {topFeatures.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className={`flex min-h-[96px] items-center gap-3 px-5 py-4 ${
                    index !== topFeatures.length - 1
                      ? "lg:border-r lg:border-purple-100"
                      : ""
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-[12px] font-black text-purple-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[10px] leading-[1.7] text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section id="categories" className="py-10 sm:py-12">
        <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="inline-flex items-center gap-2 text-[24px] font-black text-purple-950 sm:text-[28px]">
              ประเภทสัตว์ที่เราดูแล
              <Heart className="h-4.5 w-4.5 fill-pink-400 text-pink-400" />
            </h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {petCategories.map((category) => (
              <article
                key={category.id}
                className={`group overflow-hidden rounded-[24px] border ${category.border} bg-linear-to-b ${category.tone} p-4 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="overflow-hidden rounded-[20px] bg-white/70">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-[142px] w-full object-cover"
                  />
                </div>

                <h3 className={`mt-4 text-[13px] font-black ${category.title}`}>
                  {category.name}
                </h3>

                <p className="mx-auto mt-2 min-h-[42px] max-w-[240px] text-[10px] leading-[1.7] text-slate-500">
                  {category.description}
                </p>

                <Link
                  href={`/login?category=${category.id}`}
                  className={`mx-auto mt-3 flex h-7 w-7 items-center justify-center rounded-full text-white transition group-hover:scale-110 ${category.button}`}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY + HOW ================= */}
      <section className="pb-9 sm:pb-11">
        <div className="mx-auto grid max-w-[1460px] gap-4 px-4 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
          {/* WHY */}
          <section
            id="why-petbnb"
            className="relative min-h-[310px] overflow-hidden rounded-[28px] border border-purple-100 bg-linear-to-br from-[#FBF7FF] via-white to-[#FFF6FA] p-6 shadow-sm"
          >
            <h2 className="text-[20px] font-black text-purple-950">
              ทำไมต้อง PetBnB?
            </h2>

            <div className="mt-5 max-w-[72%] space-y-4">
              {whyItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-purple-950">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[9px] leading-4 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-0 right-3 hidden h-[235px] w-[205px] sm:block">
              <img
                src="/images/why-petbnb-dog.png"
                alt="สุนัขน่ารัก"
                className="h-full w-full object-contain object-bottom"
              />
              <div className="absolute inset-0 bg-linear-to-l from-transparent via-transparent to-white/10" />
            </div>

            <div className="pointer-events-none absolute right-28 top-10 text-3xl text-pink-200">
              ♡
            </div>
          </section>

          {/* HOW */}
          <section
            id="how-it-works"
            className="rounded-[28px] border border-purple-100 bg-linear-to-br from-[#FCFAFF] to-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-center text-[20px] font-black text-purple-950">
                ขั้นตอนการใช้งานสำหรับเจ้าของสัตว์เลี้ยง
              </h2>
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ownerSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.no}
                    className={`rounded-[22px] ${step.box} p-4 text-center`}
                  >
                    <div className={`text-[20px] font-black ${step.accent}`}>
                      {step.no}
                    </div>

                    <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Icon className={`h-5 w-5 ${step.accent}`} />
                    </div>

                    <h3 className="mt-3 text-[11px] font-black text-purple-950">
                      {step.title}
                    </h3>

                    <p className="mt-1.5 text-[9px] leading-4 text-slate-500">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="pb-6">
        <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[26px] bg-linear-to-r from-violet-500 via-purple-500 to-pink-400 px-6 py-7 text-center text-white shadow-xl shadow-purple-200">
            <div className="pointer-events-none absolute -left-3 bottom-[-18px] hidden h-[165px] w-[165px] sm:block">
              <img
                src="/images/cta-cat.png"
                alt=""
                className="h-full w-full object-contain object-bottom"
              />
            </div>

            <div className="pointer-events-none absolute -right-2 bottom-[-16px] hidden h-[170px] w-[170px] sm:block">
              <img
                src="/images/cta-corgi.png"
                alt=""
                className="h-full w-full object-contain object-bottom"
              />
            </div>

            <div className="relative mx-auto max-w-xl">
              <h2 className="text-[22px] font-black sm:text-[26px]">
                พร้อมหาคนดูแลน้องแล้วหรือยัง?
              </h2>

              <p className="mt-1.5 text-xs text-purple-50">
                เริ่มต้นค้นหาผู้รับฝากที่ใส่ใจสำหรับสัตว์เลี้ยงของคุณวันนี้
              </p>

              <Link
                href="/login"
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-violet-700 shadow-lg transition hover:-translate-y-0.5"
              >
                เริ่มค้นหาเลย
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-purple-100 bg-white">
        <div className="mx-auto max-w-[1460px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1.2fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white">
                  <PawPrint className="h-4 w-4" />
                </div>

                <span className="text-lg font-black text-violet-700">
                  PetBnB
                </span>

                <Heart className="h-3 w-3 fill-pink-400 text-pink-400" />
              </Link>

              <p className="mt-3 max-w-65 text-[10px] leading-[1.7] text-slate-500">
                แพลตฟอร์มบริการรับฝากสัตว์เลี้ยงที่เชื่อมต่อเจ้าของสัตว์เลี้ยงกับผู้รับฝากที่ไว้ใจได้
              </p>

            </div>

            <FooterColumn
              title="สำหรับเจ้าของ"
              links={[
                ["ค้นหาผู้รับฝาก", "/login"],
                ["วิธีใช้งาน", "#how-it-works"],
                ["คำถามที่พบบ่อย", "#why-petbnb"],
              ]}
            />

            <FooterColumn
              title="สำหรับ Sitter"
              links={[
                ["สมัครเป็น Sitter", "/signup?role=SITTER"],
                ["การเป็น Sitter", "/signup?role=SITTER"],
                ["ศูนย์ช่วยเหลือ", "#why-petbnb"],
              ]}
            />

            <FooterColumn
              title="เกี่ยวกับเรา"
              links={[
                ["เกี่ยวกับ PetBnB", "#why-petbnb"],
                ["นโยบายความเป็นส่วนตัว", "#"],
                ["ข้อกำหนดและเงื่อนไข", "#"],
              ]}
            />

            <div>
              <h3 className="text-[11px] font-black text-purple-950">
                ติดตามข่าวสาร
              </h3>

              <p className="mt-3 text-[9px] leading-4 text-slate-500">
                รับข่าวสารและโปรโมชั่นพิเศษ
              </p>

              
            </div>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-4 text-center text-[9px] text-slate-400">
            © 2026 PetBnB. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroTrust({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-violet-600">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-1.5 text-[8.5px] font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

function SocialCircle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-violet-600 transition hover:bg-violet-600 hover:text-white"
    >
      {children}
    </button>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h3 className="text-[11px] font-black text-purple-950">
        {title}
      </h3>

      <div className="mt-3 space-y-2.5">
        {links.map(([label, href]) =>
          href.startsWith("#") ? (
            <a
              key={label}
              href={href}
              className="block text-[9.5px] text-slate-500 transition hover:text-violet-700"
            >
              {label}
            </a>
          ) : (
            <Link
              key={label}
              href={href}
              className="block text-[9.5px] text-slate-500 transition hover:text-violet-700"
            >
              {label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
