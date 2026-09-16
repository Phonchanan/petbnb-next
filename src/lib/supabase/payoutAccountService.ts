import { supabase } from '@/lib/supabase/client';

export type PayoutMethod = 'BANK_TRANSFER';

export interface SitterPayoutAccount {
  id: string;
  sitter_id: string;
  bank_code: string;
  bank_name: string;
  account_name: string;
  account_last4: string;
  payout_method: PayoutMethod | string;
  is_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavePayoutAccountInput {
  sitterId: string;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
}

function validateInput(input: SavePayoutAccountInput) {
  if (!input.sitterId) {
    throw new Error('ไม่พบข้อมูลผู้รับเลี้ยง');
  }

  if (!input.bankCode.trim() || !input.bankName.trim()) {
    throw new Error('กรุณาเลือกธนาคาร');
  }

  if (!input.accountName.trim()) {
    throw new Error('กรุณากรอกชื่อบัญชี');
  }

  if (!/^\d{4}$/.test(input.accountLast4.trim())) {
    throw new Error('กรุณากรอกเลขท้ายบัญชี 4 หลัก');
  }
}

export const PayoutAccountService = {
  async getBySitterId(
    sitterId: string
  ): Promise<SitterPayoutAccount | null> {
    if (!sitterId) {
      throw new Error('ไม่พบข้อมูลผู้รับเลี้ยง');
    }

    const { data, error } = await supabase
      .from('sitter_payout_accounts')
      .select('*')
      .eq('sitter_id', sitterId)
      .maybeSingle();

    if (error) {
      console.error('GET PAYOUT ACCOUNT ERROR:', error);
      throw new Error(error.message);
    }

    return data as SitterPayoutAccount | null;
  },

  async save(
    input: SavePayoutAccountInput
  ): Promise<SitterPayoutAccount> {
    validateInput(input);

    const { data, error } = await supabase
      .from('sitter_payout_accounts')
      .upsert(
        {
          sitter_id: input.sitterId,
          bank_code: input.bankCode.trim(),
          bank_name: input.bankName.trim(),
          account_name: input.accountName.trim(),
          account_last4: input.accountLast4.trim(),
          payout_method: 'BANK_TRANSFER',
          is_ready: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'sitter_id',
        }
      )
      .select('*')
      .single();

    if (error) {
      console.error('SAVE PAYOUT ACCOUNT ERROR:', error);
      throw new Error(error.message);
    }

    return data as SitterPayoutAccount;
  },

  getMaskedAccount(accountLast4: string | null | undefined) {
    if (!accountLast4) {
      return '-';
    }

    return `•••• ${accountLast4}`;
  },
};
