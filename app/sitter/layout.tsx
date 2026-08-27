import type { ReactNode } from 'react';

import SitterNav from '@/components/sitter/SitterNav';

export default function SitterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF7FE]">
      <SitterNav />

      {children}
    </div>
  );
}