-- Seed data for bank_accounts table
-- This file contains sample bank account data for testing

-- Vietnamese popular banks data
INSERT INTO public.bank_accounts (
  user_id, 
  hotel_id, 
  holder_name, 
  account_number, 
  bank_name, 
  branch_name, 
  is_default, 
  status
) VALUES 
-- Sample user accounts (replace with actual user UUIDs)
(
  '00000000-0000-0000-0000-000000000001', -- Replace with actual user UUID
  NULL,
  'Nguyễn Văn A',
  '1234567890123456',
  'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
  'Chi nhánh Hà Nội',
  true,
  'active'
),
(
  '00000000-0000-0000-0000-000000000001', -- Same user, second account
  NULL,
  'Nguyễn Văn A',
  '9876543210987654',
  'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)',
  'Chi nhánh Cầu Giấy',
  false,
  'active'
),

-- Sample hotel accounts (replace with actual user and hotel UUIDs)
(
  '00000000-0000-0000-0000-000000000002', -- Hotel owner user UUID
  '00000000-0000-0000-0000-000000000001', -- Hotel UUID
  'Công ty TNHH Khách sạn ABC',
  '5555666677778888',
  'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
  'Chi nhánh Hoàn Kiếm',
  true,
  'active'
),
(
  '00000000-0000-0000-0000-000000000003', -- Another hotel owner
  '00000000-0000-0000-0000-000000000002', -- Another hotel
  'Khách sạn XYZ',
  '1111222233334444',
  'Ngân hàng TMCP Công thương Việt Nam (VietinBank)',
  'Chi nhánh Tây Hồ',
  true,
  'active'
),

-- More sample accounts with different banks
(
  '00000000-0000-0000-0000-000000000004',
  NULL,
  'Trần Thị B',
  '6666777788889999',
  'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
  'Chi nhánh Đống Đa',
  true,
  'active'
),
(
  '00000000-0000-0000-0000-000000000005',
  NULL,
  'Lê Văn C',
  '2222333344445555',
  'Ngân hàng TMCP Quân đội (MB Bank)',
  'Chi nhánh Ba Đình',
  true,
  'active'
),
(
  '00000000-0000-0000-0000-000000000006',
  NULL,
  'Phạm Thị D',
  '7777888899990000',
  'Ngân hàng TMCP Tiên Phong (TPBank)',
  'Chi nhánh Thanh Xuân',
  true,
  'active'
),
(
  '00000000-0000-0000-0000-000000000007',
  NULL,
  'Hoàng Văn E',
  '3333444455556666',
  'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
  'Chi nhánh Nam Từ Liêm',
  true,
  'active'
),
(
  '00000000-0000-0000-0000-000000000008',
  NULL,
  'Vũ Thị F',
  '8888999900001111',
  'Ngân hàng TMCP Bản Việt (Viet Capital Bank)',
  'Chi nhánh Hai Bà Trưng',
  true,
  'active'
);

-- Note: 
-- 1. Replace the UUIDs above with actual user_id and hotel_id from your database
-- 2. These are sample Vietnamese bank account numbers (not real)
-- 3. Popular Vietnamese banks included for realistic testing
-- 4. Account numbers follow Vietnamese banking format (typically 12-19 digits)