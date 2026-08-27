import type { ReactNode } from 'react';

import OwnerNav from '@/components/owner/OwnerNav';

export default function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF7FE]">
      <OwnerNav />

      {children}
    </div>
  );
}