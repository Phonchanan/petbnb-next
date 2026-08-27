'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestSupabasePage() {
  const [message, setMessage] =
    useState('กำลังตรวจสอบ...');

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.error(error);
        setMessage(`เชื่อมต่อไม่สำเร็จ: ${error.message}`);
        return;
      }

      setMessage('เชื่อมต่อ Supabase สำเร็จ ✅');
    };

    testConnection();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="p-6 bg-white rounded-2xl shadow">
        {message}
      </div>
    </main>
  );
}