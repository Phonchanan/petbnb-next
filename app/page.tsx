import Link from 'next/link';

import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Heart,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from 'lucide-react';

const petCategories = [
  {
    id: 'SMALL_MAMMALS',
    icon: '🐹',
    name: 'สัตว์เลี้ยงลูกด้วยนมขนาดเล็ก',
    description:
      'กระต่าย แฮมสเตอร์ แกสบี้ ชูการ์ไกลเดอร์ เม่นแคระ และชินชิลล่า',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    id: 'CANINE_FELINE',
    icon: '🐕',
    name: 'สุนัขและแมว',
    description:
      'บริการดูแลสุนัขและแมวหลากหลายสายพันธุ์โดยผู้รับฝากที่ผ่านการตรวจสอบ',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    id: 'REPTILES_AMPHIBIANS_AQUATICS',
    icon: '🦎',
    name: 'สัตว์เลื้อยคลานและสัตว์น้ำ',
    description:
      'งูเลี้ยง เบียร์ดดราก้อน เกคโค เต่า กบ และปลาสวยงาม',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    id: 'ORNAMENTAL_BIRDS_AVIANS',
    icon: '🦜',
    name: 'นกและสัตว์ปีกสวยงาม',
    description:
      'ค็อกคาเทล คอนัวร์ เลิฟเบิร์ด หงส์หยก และนกสวยงาม',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'ผู้รับฝากผ่านการตรวจสอบ',
    description:
      'ตรวจสอบข้อมูลและเอกสารยืนยันตัวตนก่อนเปิดให้บริการบนแพลตฟอร์ม',
  },
  {
    icon: BadgeCheck,
    title: 'มีแบบทดสอบความรู้',
    description:
      'Sitter ต้องผ่านแบบทดสอบพื้นฐานและแบบทดสอบตามประเภทสัตว์ที่รับดูแล',
  },
  {
    icon: MapPin,
    title: 'ค้นหาในพื้นที่',
    description:
      'ค้นหาผู้รับฝากตามพื้นที่ให้บริการ เพื่อให้เลือกผู้ดูแลที่เหมาะกับคุณ',
  },
  {
    icon: CalendarCheck,
    title: 'จัดการการจองได้ง่าย',
    description:
      'ส่งคำขอฝากเลี้ยงและติดตามสถานะการจองได้ภายในระบบ PetBnB',
  },
];

const ownerSteps = [
  {
    number: '01',
    title: 'เพิ่มข้อมูลสัตว์เลี้ยง',
    description:
      'บันทึกข้อมูลพื้นฐาน พฤติกรรม อาหาร และข้อมูลที่จำเป็นต่อการดูแล',
  },
  {
    number: '02',
    title: 'ค้นหา Sitter',
    description:
      'ค้นหาและเลือกผู้รับฝากที่รองรับประเภทสัตว์และพื้นที่ที่ต้องการ',
  },
  {
    number: '03',
    title: 'ส่งคำขอจอง',
    description:
      'เลือกวันที่และบริการ จากนั้นส่งคำขอไปยัง Sitter ที่คุณเลือก',
  },
  {
    number: '04',
    title: 'ติดตามสถานะ',
    description:
      'ตรวจสอบว่าคำขอได้รับการยืนยัน ปฏิเสธ หรือกำลังให้บริการ',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FCFAFF] text-slate-800">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-purple-100/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm shadow-purple-200">
              <PawPrint className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xl font-black tracking-tight text-[#2E1065]">
                PetBnB
              </p>

              <p className="-mt-1 hidden text-[9px] font-semibold tracking-wide text-purple-400 sm:block">
                PET CARE PLATFORM
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              href="/"
              className="text-sm font-bold text-purple-700"
            >
              หน้าแรก
            </Link>

            <a
              href="#categories"
              className="text-sm font-semibold text-slate-500 transition hover:text-purple-700"
            >
              ประเภทสัตว์
            </a>

            <a
              href="#why-petbnb"
              className="text-sm font-semibold text-slate-500 transition hover:text-purple-700"
            >
              ทำไมต้อง PetBnB
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-500 transition hover:text-purple-700"
            >
              วิธีใช้งาน
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-purple-700 transition hover:bg-purple-50 sm:inline-flex"
            >
              เข้าสู่ระบบ
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700"
            >
              สมัครสมาชิก
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-purple-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-pink-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3.5 py-2 text-xs font-bold text-purple-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              ดูแลสัตว์ที่คุณรักอย่างมั่นใจ
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.15] tracking-tight text-[#2E1065] sm:text-5xl lg:text-[58px]">
              ฝากสัตว์อย่างอุ่นใจ
              <span className="block text-purple-600">
                กับผู้ดูแลที่เหมาะกับเขา
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              PetBnB ช่วยเชื่อมต่อเจ้าของสัตว์เลี้ยงกับผู้รับฝาก
              ที่ผ่านการตรวจสอบและแบบทดสอบความรู้
              เพื่อให้คุณเลือกผู้ดูแลที่เหมาะกับสัตว์เลี้ยงแต่ละประเภทได้ง่ายขึ้น
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 text-sm font-bold text-white shadow-lg shadow-purple-200/70 transition hover:-translate-y-0.5 hover:bg-purple-700"
              >
                <Search className="h-4 w-4" />
                ค้นหาผู้รับฝาก
              </Link>

              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-white px-6 text-sm font-bold text-purple-700 transition hover:bg-purple-50"
              >
                <Heart className="h-4 w-4" />
                สมัครเป็น Sitter
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <TrustItem text="ตรวจสอบผู้รับฝาก" />
              <TrustItem text="มีแบบทดสอบความรู้" />
              <TrustItem text="รองรับสัตว์หลายประเภท" />
            </div>
          </div>

          <HeroPetCard />
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Pet Categories"
            title="เลือกการดูแลตามประเภทสัตว์"
            description="ผู้รับฝากจะได้รับการรับรองเฉพาะประเภทสัตว์ที่ผ่านแบบทดสอบความรู้"
          />

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {petCategories.map((category) => (
              <article
                key={category.id}
                className={`group rounded-[26px] border ${category.border} ${category.bg} p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-100/60`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                  {category.icon}
                </div>

                <h3 className="mt-5 text-base font-black leading-6 text-[#2E1065]">
                  {category.name}
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {category.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-purple-600">
                  ดูผู้รับฝาก
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PETBNB */}
      <section
        id="why-petbnb"
        className="bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                <ShieldCheck className="h-4 w-4" />
                Why PetBnB?
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight text-[#2E1065] sm:text-4xl">
                เลือกคนดูแลสัตว์
                <br />
                ได้อย่างมั่นใจมากขึ้น
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
                ผู้รับฝากบน PetBnB ต้องผ่านขั้นตอนยืนยันข้อมูล
                แบบทดสอบพื้นฐาน และการทดสอบตามประเภทสัตว์
                ก่อนเข้าสู่ขั้นตอนการอนุมัติจากผู้ดูแลระบบ
              </p>

              <div className="mt-6 rounded-3xl border border-purple-100 bg-[#FAF8FE] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <UserCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-purple-950">
                      Sitter Verification
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      เปิดรับงานได้หลังผ่านขั้นตอนสมัคร
                      และได้รับการอนุมัติจาก Admin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-[26px] border border-purple-100 bg-[#FCFAFF] p-5 transition hover:border-purple-200 hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-4 text-sm font-black text-purple-950">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="How it works"
            title="ฝากสัตว์ง่าย ๆ ในไม่กี่ขั้นตอน"
            description="เริ่มตั้งแต่สร้างข้อมูลสัตว์ ไปจนถึงติดตามสถานะการฝากเลี้ยง"
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ownerSteps.map((step, index) => (
              <article
                key={step.number}
                className="relative rounded-[26px] border border-purple-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-purple-100">
                    {step.number}
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                </div>

                <h3 className="mt-5 text-sm font-black text-purple-950">
                  {step.title}
                </h3>

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SITTER CTA */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[34px] bg-[#32105F] px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-purple-100">
                  <Heart className="h-4 w-4" />
                  Become a Sitter
                </div>

                <h2 className="mt-4 max-w-xl text-2xl font-black leading-tight sm:text-3xl">
                  รักสัตว์และอยากเป็นส่วนหนึ่งของ PetBnB?
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-purple-100">
                  สมัครเป็นผู้รับฝาก ผ่านขั้นตอนยืนยันข้อมูล
                  และแบบทดสอบความรู้ตามประเภทสัตว์ที่คุณต้องการรับดูแล
                </p>
              </div>

              <Link
                href="/signup"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-purple-700 transition hover:bg-purple-50"
              >
                สมัครเป็น Sitter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-purple-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <PawPrint className="h-4 w-4" />
                </div>

                <span className="text-xl font-black text-[#2E1065]">
                  PetBnB
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-xs leading-6 text-slate-500">
                แพลตฟอร์มดิจิทัลสำหรับเชื่อมต่อเจ้าของสัตว์เลี้ยง
                กับผู้รับฝากที่เหมาะสม
              </p>
            </div>

            <div>
              <p className="text-xs font-black text-purple-950">
                เมนู
              </p>

              <div className="mt-4 space-y-3 text-xs text-slate-500">
                <a
                  href="#categories"
                  className="block hover:text-purple-700"
                >
                  ประเภทสัตว์
                </a>

                <a
                  href="#why-petbnb"
                  className="block hover:text-purple-700"
                >
                  ทำไมต้อง PetBnB
                </a>

                <a
                  href="#how-it-works"
                  className="block hover:text-purple-700"
                >
                  วิธีใช้งาน
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-black text-purple-950">
                บัญชี
              </p>

              <div className="mt-4 space-y-3 text-xs text-slate-500">
                <Link
                  href="/login"
                  className="block hover:text-purple-700"
                >
                  เข้าสู่ระบบ
                </Link>

                <Link
                  href="/signup"
                  className="block hover:text-purple-700"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-2 border-t border-slate-100 pt-5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © PetBnB. All rights reserved.
            </p>

            <p>
              Pet care made easier.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
 * HERO CARD
 * ======================================================= */

function HeroPetCard() {
  return (
    <div className="relative mx-auto w-full max-w-132.5">
      <div className="absolute -left-5 top-16 z-10 hidden rounded-2xl border border-purple-100 bg-white p-3 shadow-lg sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BadgeCheck className="h-4 w-4" />
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-700">
              Verified Sitter
            </p>

            <p className="text-[9px] text-slate-400">
              ผ่านการตรวจสอบ
            </p>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 bottom-20 z-10 hidden rounded-2xl border border-purple-100 bg-white p-3 shadow-lg sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-700">
              Pet Care
            </p>

            <p className="text-[9px] text-slate-400">
              ใส่ใจทุกการดูแล
            </p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[40px] border border-purple-100 bg-linear-to-br from-purple-100 via-[#F9F1FF] to-pink-100 p-6 shadow-xl shadow-purple-100 sm:p-8">
        <div className="flex min-h-102.5 flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 scale-110 rounded-full bg-white/50 blur-2xl" />

            <div className="relative flex h-60 w-60 items-center justify-center rounded-full border-8 border-white/60 bg-white/40 shadow-inner sm:h-72 sm:w-72">
              <div className="grid grid-cols-2 gap-4">
                <PetBubble emoji="🐶" />
                <PetBubble emoji="🐱" />
                <PetBubble emoji="🐹" />
                <PetBubble emoji="🦜" />
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-2xl bg-white/70 px-5 py-3 text-center backdrop-blur">
            <p className="text-sm font-black text-purple-950">
              ดูแลทุกความพิเศษของสัตว์เลี้ยง
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Dogs • Cats • Exotic Pets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PetBubble({
  emoji,
}: {
  emoji: string;
}) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-white bg-white/90 text-4xl shadow-md sm:h-24 sm:w-24 sm:text-5xl">
      {emoji}
    </div>
  );
}

function SectionHeading({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
        {badge}
      </div>

      <h2 className="mt-4 text-2xl font-black text-[#2E1065] sm:text-3xl">
        {title}
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TrustItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />

      {text}
    </div>
  );
}