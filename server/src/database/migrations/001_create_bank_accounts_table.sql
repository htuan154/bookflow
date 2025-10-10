-- Migration: Create bank_accounts table
-- Date: 2025-10-05
-- Description: Tạo bảng quản lý tài khoản ngân hàng cho users và hotels

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  bank_account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Chủ sở hữu: bắt buộc có user_id
  user_id   UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  hotel_id  UUID REFERENCES public.hotels(hotel_id) ON DELETE CASCADE,

  holder_name    TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name      TEXT NOT NULL,
  branch_name    TEXT,

  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  status         VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive')),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Đảm bảo số tài khoản là duy nhất trong cùng 1 ngân hàng
  CONSTRAINT uq_bank_accounts_number_bank UNIQUE (account_number, bank_name)
);

-- Index cho performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_hotel_id ON public.bank_accounts (hotel_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON public.bank_accounts (status);

-- Mỗi user chỉ 1 STK mặc định (phục vụ refund)
CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_accounts_user_default
ON public.bank_accounts (user_id)
WHERE is_default = TRUE AND hotel_id IS NULL;

-- Mỗi hotel chỉ 1 STK mặc định (đích payout)
CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_accounts_hotel_default
ON public.bank_accounts (hotel_id)
WHERE hotel_id IS NOT NULL AND is_default = TRUE;

-- Trigger để auto update updated_at
CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_accounts_updated_at();

-- Thêm một số dữ liệu mẫu (optional)
-- INSERT INTO public.bank_accounts (user_id, holder_name, account_number, bank_name, branch_name, is_default)
-- VALUES 
--   ('user-uuid-here', 'Nguyen Van A', '1234567890123456', 'Vietcombank', 'Chi nhánh Hà Nội', true),
--   ('user-uuid-here', 'Tran Thi B', '9876543210987654', 'Techcombank', 'Chi nhánh TP.HCM', false);

COMMENT ON TABLE public.bank_accounts IS 'Bảng quản lý tài khoản ngân hàng cho users và hotels';
COMMENT ON COLUMN public.bank_accounts.user_id IS 'ID của user sở hữu tài khoản (bắt buộc)';
COMMENT ON COLUMN public.bank_accounts.hotel_id IS 'ID của hotel (nếu tài khoản dành cho hotel)';
COMMENT ON COLUMN public.bank_accounts.holder_name IS 'Tên chủ tài khoản';
COMMENT ON COLUMN public.bank_accounts.account_number IS 'Số tài khoản ngân hàng';
COMMENT ON COLUMN public.bank_accounts.bank_name IS 'Tên ngân hàng';
COMMENT ON COLUMN public.bank_accounts.branch_name IS 'Tên chi nhánh';
COMMENT ON COLUMN public.bank_accounts.is_default IS 'Tài khoản mặc định (true/false)';
COMMENT ON COLUMN public.bank_accounts.status IS 'Trạng thái tài khoản (active/inactive)';