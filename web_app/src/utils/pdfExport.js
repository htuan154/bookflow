import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Vietnamese currency format
const formatCurrency = (n) => Number(n || 0).toLocaleString('vi-VN') + ' d';
const todayStr = () => new Date().toLocaleString('vi-VN');

// Convert Vietnamese to ASCII for reliable PDF rendering
// jsPDF default fonts don't support Vietnamese diacritics
const toAscii = (text) => {
  if (!text) return '';
  const map = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'Đ': 'D',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    '₫': 'd', '→': '->'
  };
  return String(text).split('').map(c => map[c] || c).join('');
};

// Shorthand
const t = toAscii;

export function exportAdminReportPDF({ filters, summary, rows }) {
  const doc = new jsPDF({ 
    unit: 'pt', 
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const marginX = 40;
  let y = 40;

  // Header
  doc.setFontSize(16);
  doc.text(t('Bao cao thong ke Admin'), marginX, y);
  y += 20;
  doc.setFontSize(10);
  doc.text(t(`Xuat luc: ${todayStr()}`), marginX, y);
  y += 16;
  doc.text(t(`Khoang thoi gian: ${filters.date_from} -> ${filters.date_to}`), marginX, y);
  y += 14;
  doc.text(t(`Khach san: ${filters.hotel_filter || 'ALL'}`), marginX, y);
  y += 22;

  // KPI totals from summary.daily_summary
  let gross = 0, pg = 0, admin = 0, net = 0, bookings = 0, hotels = new Set();
  const daily = summary?.daily_summary || [];
  daily.forEach(r => {
    gross += Number(r.finalSum || 0);
    pg    += Number(r.pgFeeSum || 0);
    admin += Number(r.adminFeeSum || 0);
    net   += Number(r.hotelNetSum || 0);
    bookings += Number(r.bookingsCount || 0);
    if (r.hotelId) hotels.add(r.hotelId);
  });

  doc.setFontSize(12);
  doc.text(t('Tong quan:'), marginX, y);
  y += 16;
  doc.setFontSize(10);
  const kpiLines = [
    t(`- Tong doanh thu: ${formatCurrency(gross)}`),
    t(`- Phi thanh toan: ${formatCurrency(pg)}`),
    t(`- Phi quan ly: ${formatCurrency(admin)}`),
    t(`- Thu nhap khach san: ${formatCurrency(net)}`),
    t(`- So dat phong: ${bookings}`),
    t(`- So khach san: ${hotels.size}`),
  ];
  kpiLines.forEach(line => { doc.text(line, marginX, y); y += 14; });
  y += 6;

  // Table for currently displayed rows
  const columns = [
    { header: t('Ngay'), dataKey: 'bizDateVn' },
    { header: t('Khach san'), dataKey: 'hotelName' },
    { header: 'TP', dataKey: 'hotelCity' },
    { header: t('Dat phong'), dataKey: 'bookingsCount' },
    { header: t('Tong thu'), dataKey: 'finalSum' },
    { header: t('Phi TT'), dataKey: 'pgFeeSum' },
    { header: t('Phi QL'), dataKey: 'adminFeeSum' },
    { header: t('Thu nhap KS'), dataKey: 'hotelNetSum' },
    { header: t('Thanh toan'), dataKey: 'exists_in_payouts' },
  ];

  const body = (rows || []).map(r => ({
    bizDateVn: r.bizDateVn,
    hotelName: t(r.hotelName),
    hotelCity: t(r.hotelCity),
    bookingsCount: r.bookingsCount,
    finalSum: formatCurrency(r.finalSum),
    pgFeeSum: formatCurrency(r.pgFeeSum),
    adminFeeSum: formatCurrency(r.adminFeeSum),
    hotelNetSum: formatCurrency(r.hotelNetSum),
    exists_in_payouts: r.exists_in_payouts ? t('Da thanh toan') : t('Chua'),
  }));

  autoTable(doc, {
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [25, 118, 210] },
    columns,
    body,
  });

  doc.save(`admin-report_${filters.date_from}_${filters.date_to}.pdf`);
}

export function exportOwnerReportPDF({ filters, payments, payouts, scopeLabel = 'Khach san dang chon' }) {
  const doc = new jsPDF({ 
    unit: 'pt', 
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const marginX = 40;
  let y = 40;

  doc.setFontSize(16);
  doc.text(t('Bao cao doanh thu khach san'), marginX, y);
  y += 20;
  doc.setFontSize(10);
  doc.text(t(`Xuat luc: ${todayStr()}`), marginX, y);
  y += 16;
  doc.text(t(`Khoang thoi gian: ${filters.date_from} -> ${filters.date_to}`), marginX, y);
  y += 14;
  doc.text(t(`Pham vi: ${scopeLabel}`), marginX, y);
  y += 20;

  const paymentRows = payments?.rows || payments || [];
  const payoutRows = payouts?.rows || payouts || [];

  // Compute unpaid totals
  let gross = 0, pg = 0, admin = 0, net = 0, count = 0;
  paymentRows.forEach(r => {
    gross += Number(r.finalAmount || 0);
    pg    += Number(r.pgFeeAmount || 0);
    admin += Number(r.adminFeeAmount || 0);
    net   += Number(r.hotelNetAmount || 0);
    count += 1;
  });

  // Compute paid totals (processed payouts)
  let paidAmount = 0, paidCount = 0;
  payoutRows.filter(p => (p.status || '').toLowerCase() === 'processed').forEach(p => {
    paidAmount += Number(p.total_net_amount || p.totalNetAmount || 0);
    paidCount += 1;
  });

  // KPI blocks
  doc.setFontSize(12);
  doc.text(t('Chua thanh toan:'), marginX, y); 
  y += 16; 
  doc.setFontSize(10);
  [
    t(`- Doanh thu chua thanh toan: ${formatCurrency(gross)}`),
    t(`- Phi thanh toan: ${formatCurrency(pg)}`),
    t(`- Phi quan ly: ${formatCurrency(admin)}`),
    t(`- Thu nhap thuc te (chua nhan): ${formatCurrency(net)}`),
    t(`- Giao dich chua thanh toan: ${count}`),
  ].forEach(line => { doc.text(line, marginX, y); y += 14; });
  y += 6;

  doc.setFontSize(12);
  doc.text(t('Da thanh toan:'), marginX, y); 
  y += 16; 
  doc.setFontSize(10);
  [
    t(`- Da thanh toan (payout): ${formatCurrency(paidAmount)}`),
    t(`- So luot payout: ${paidCount}`),
  ].forEach(line => { doc.text(line, marginX, y); y += 14; });
  y += 10;

  // Tables
  const paymentsColumns = [
    { header: t('Ngay'), dataKey: 'bizDateVn' },
    { header: t('Khach san'), dataKey: 'hotelName' },
    { header: t('Tong thu'), dataKey: 'finalAmount' },
    { header: t('Phi TT'), dataKey: 'pgFeeAmount' },
    { header: t('Phi QL'), dataKey: 'adminFeeAmount' },
    { header: t('Thu nhap'), dataKey: 'hotelNetAmount' },
    { header: 'Booking', dataKey: 'bookingId' },
  ];
  const paymentsBody = paymentRows.map(r => ({
    bizDateVn: r.bizDateVn,
    hotelName: t(r.hotelName),
    finalAmount: formatCurrency(r.finalAmount),
    pgFeeAmount: formatCurrency(r.pgFeeAmount),
    adminFeeAmount: formatCurrency(r.adminFeeAmount),
    hotelNetAmount: formatCurrency(r.hotelNetAmount),
    bookingId: (r.bookingId || '').slice(0, 8),
  }));

  autoTable(doc, {
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
    columns: paymentsColumns,
    body: paymentsBody,
    margin: { left: marginX, right: marginX },
  });

  y = doc.lastAutoTable.finalY + 16;

  const payoutsColumns = [
    { header: t('Ngay bao trum'), dataKey: 'cover_date' },
    { header: t('Thoi gian tao'), dataKey: 'scheduled_at' },
    { header: t('So tien'), dataKey: 'total_net_amount' },
    { header: t('Trang thai'), dataKey: 'status' },
  ];
  const payoutsBody = payoutRows.map(r => ({
    cover_date: r.cover_date,
    scheduled_at: r.scheduled_at ? new Date(r.scheduled_at).toLocaleString('vi-VN') : '-',
    total_net_amount: formatCurrency(r.total_net_amount || r.totalNetAmount),
    status: t(r.status),
  }));

  autoTable(doc, {
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    columns: payoutsColumns,
    body: payoutsBody,
    margin: { left: marginX, right: marginX },
  });

  const scopeSuffix = scopeLabel.includes('Tat ca') || scopeLabel.includes('tat ca') ? 'all' : 'selected';
  doc.save(`owner-report_${scopeSuffix}_${filters.date_from}_${filters.date_to}.pdf`);
}
