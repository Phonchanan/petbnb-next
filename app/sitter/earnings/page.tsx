'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock3, Loader2, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { SitterProfileService } from '@/lib/supabase/sitterProfileService';

interface EarningItem {
  id: string;
  bookingId: string;
  bookingCode: string | null;
  petName: string;
  amount: number;
  commissionFee: number;
  netAmount: number;
  escrowStatus: string | null;
  transactionRef: string | null;
  paidAt: string | null;
  releasedAt: string | null;
}

interface BookingRow {
  id: string;
  booking_code: string | null;
  pet: { name: string } | { name: string }[] | null;
}

interface PaymentRow {
  id: string;
  booking_id: string;
  amount: number | string;
  commission_fee: number | string | null;
  net_amount: number | string;
  escrow_status: string | null;
  transaction_ref: string | null;
  paid_at: string | null;
  released_at: string | null;
}

export default function SitterEarningsPage() {
  const router = useRouter();
  const [items, setItems] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        setLoading(true);
        setError('');

        const profile = await AuthService.getCurrentProfile();
        if (!profile) {
          router.replace('/login');
          return;
        }

        if (profile.role.toUpperCase() !== 'SITTER') {
          router.replace('/');
          return;
        }

        const sitter = await SitterProfileService.getByUserId(profile.id);
        if (!sitter) {
          throw new Error('ไม่พบข้อมูลผู้รับเลี้ยง');
        }

        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_code,
            pet:pets!bookings_pet_id_fkey (name)
          `)
          .eq('sitter_id', sitter.id);

        if (bookingError) throw new Error(bookingError.message);

        const bookings = (bookingData ?? []) as unknown as BookingRow[];
        if (bookings.length === 0) {
          setItems([]);
          return;
        }

        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select(`
            id,
            booking_id,
            amount,
            commission_fee,
            net_amount,
            escrow_status,
            transaction_ref,
            paid_at,
            released_at
          `)
          .in('booking_id', bookings.map((booking) => booking.id))
          .eq('payment_status', 'PAID')
          .order('paid_at', { ascending: false });

        if (paymentError) throw new Error(paymentError.message);

        const bookingMap = new Map(
          bookings.map((booking) => {
            const pet = Array.isArray(booking.pet)
              ? booking.pet[0] ?? null
              : booking.pet;
            return [booking.id, { code: booking.booking_code, petName: pet?.name ?? '-' }];
          })
        );

        setItems(((paymentData ?? []) as PaymentRow[]).map((payment) => {
          const booking = bookingMap.get(payment.booking_id);
          return {
            id: payment.id,
            bookingId: payment.booking_id,
            bookingCode: booking?.code ?? null,
            petName: booking?.petName ?? '-',
            amount: Number(payment.amount ?? 0),
            commissionFee: Number(payment.commission_fee ?? 0),
            netAmount: Number(payment.net_amount ?? 0),
            escrowStatus: payment.escrow_status,
            transactionRef: payment.transaction_ref,
            paidAt: payment.paid_at,
            releasedAt: payment.released_at,
          };
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดประวัติรายได้ได้');
      } finally {
        setLoading(false);
      }
    };

    void loadEarnings();
  }, [router]);

  const summary = useMemo(() => items.reduce(
    (result, item) => ({
      total: result.total + item.netAmount,
      pending: result.pending + (item.escrowStatus === 'HELD' ? item.netAmount : 0),
      completed: result.completed + (item.escrowStatus === 'RELEASED' ? item.netAmount : 0),
    }),
    { total: 0, pending: 0, completed: 0 }
  ), [items]);

  if (loading) {
    return <main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-purple-600" /></main>;
  }

  return (
    <main className="min-h-screen bg-[#FAF7FE] px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => router.push('/sitter')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-700">
          <ArrowLeft className="h-4 w-4" /> กลับหน้าแดชบอร์ด
        </button>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-widest text-purple-500">Earnings</p>
          <h1 className="mt-1 text-2xl font-black text-purple-950">ประวัติรายได้</h1>
          <p className="mt-1 text-sm text-slate-500">ยอดในหน้านี้เป็นสถานะการดำเนินการภายในระบบทดลอง ไม่ใช่หลักฐานการโอนเงินจริง</p>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="รายได้สุทธิทั้งหมด" value={formatMoney(summary.total)} tone="purple" />
          <SummaryCard label="รายได้รอดำเนินการ" value={formatMoney(summary.pending)} tone="amber" />
          <SummaryCard label="รายได้สำเร็จแล้ว" value={formatMoney(summary.completed)} tone="green" />
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-purple-100 p-5">
            <Wallet className="h-5 w-5 text-purple-600" />
            <h2 className="font-black text-purple-950">รายการรายได้</h2>
          </div>

          {items.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">ยังไม่มีรายการรายได้</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <article key={item.id} className="grid gap-4 p-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
                  <div>
                    <p className="font-black text-purple-950">{item.bookingCode ?? `Booking ${item.bookingId.slice(0, 8)}`}</p>
                    <p className="mt-1 text-xs text-slate-500">สัตว์เลี้ยง: {item.petName}</p>
                    <p className="mt-1 text-xs text-slate-400">อ้างอิง: {item.transactionRef ?? '-'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-400">เจ้าของชำระ {formatMoney(item.amount)}</p>
                    <p className="text-slate-400">ค่าธรรมเนียม {formatMoney(item.commissionFee)}</p>
                    <p className="mt-1 font-black text-emerald-700">สุทธิ {formatMoney(item.netAmount)}</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    <p>ชำระ: {formatDateTime(item.paidAt)}</p>
                    <p className="mt-1">ดำเนินการ: {formatDateTime(item.releasedAt)}</p>
                  </div>
                  <StatusBadge status={item.escrowStatus} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: 'purple' | 'amber' | 'green' }) {
  const colors = tone === 'green' ? 'bg-emerald-50 text-emerald-800' : tone === 'amber' ? 'bg-amber-50 text-amber-800' : 'bg-purple-100 text-purple-950';
  return <div className={`rounded-3xl p-5 ${colors}`}><p className="text-xs font-bold opacity-70">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function StatusBadge({ status }: { status: string | null }) {
  const released = status === 'RELEASED';
  return <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${released ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Clock3 className="h-3.5 w-3.5" />{released ? 'รายได้สำเร็จแล้ว' : 'รายได้รอดำเนินการ'}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(date);
}
