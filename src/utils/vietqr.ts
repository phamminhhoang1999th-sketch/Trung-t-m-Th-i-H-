import QRCode from 'qrcode';
import { BankInfo } from '../types';

export const POPULAR_BANKS: BankInfo[] = [
  { id: 'MB', code: 'MB', name: 'Ngân hàng Quân Đội', shortName: 'MBBank', bin: '970422' },
  { id: 'VCB', code: 'VCB', name: 'Ngân hàng Ngoại Thương Việt Nam', shortName: 'Vietcombank', bin: '970436' },
  { id: 'TCB', code: 'TCB', name: 'Ngân hàng Kỹ Thương Việt Nam', shortName: 'Techcombank', bin: '970407' },
  { id: 'BIDV', code: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển Việt Nam', shortName: 'BIDV', bin: '970418' },
  { id: 'ICB', code: 'CTG', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'VietinBank', bin: '970415' },
  { id: 'ACB', code: 'ACB', name: 'Ngân hàng Á Châu', shortName: 'ACB', bin: '970416' },
  { id: 'TPB', code: 'TPB', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank', bin: '970423' },
  { id: 'VPB', code: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank', bin: '970432' },
  { id: 'STB', code: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín', shortName: 'Sacombank', bin: '970403' },
  { id: 'VBA', code: 'VBA', name: 'Ngân hàng Nông nghiệp & PT Nông thôn', shortName: 'Agribank', bin: '970405' },
  { id: 'HDB', code: 'HDB', name: 'Ngân hàng Phát triển TP.HCM', shortName: 'HDBank', bin: '970437' },
  { id: 'MSB', code: 'MSB', name: 'Ngân hàng Hàng Hải Việt Nam', shortName: 'MSB', bin: '970426' },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatMonthVN(monthStr: string): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return monthStr;
}

/**
 * Tạo URL hình ảnh VietQR chuẩn Napas247 (compact2 template)
 */
export function getVietQRImageUrl(options: {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount?: number;
  description: string;
}): string {
  const { bankId, accountNo, accountName, amount = 0, description } = options;
  const cleanBankId = bankId.trim();
  const cleanAccountNo = accountNo.trim();
  const cleanAccountName = encodeURIComponent(accountName.trim().toUpperCase());
  const cleanDescription = encodeURIComponent(description.trim());
  const validAmount = Math.max(0, Math.round(amount));

  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-compact2.png?amount=${validAmount}&addInfo=${cleanDescription}&accountName=${cleanAccountName}`;
}

/**
 * Sinh mã QR data URL dự phòng trực tiếp bằng thư viện QRCode (offline-capable)
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR Data URL:', err);
    return '';
  }
}

/**
 * Tạo cú pháp tin nhắn Zalo gửi phụ huynh
 */
export function generateParentMessage(options: {
  studentName: string;
  studentCode: string;
  month: string;
  className: string;
  totalSessions: number;
  feeAmount: number;
  dueDate: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  transferSyntax: string;
  hotline: string;
}): string {
  return `Kính gửi Quý phụ huynh học sinh ${options.studentName} (${options.studentCode}),

Trung tâm Giáo dục Thái Hà xin gửi thông báo học phí ${formatMonthVN(options.month)}:
- Lớp: ${options.className}
- Số buổi học trong tháng: ${options.totalSessions} buổi
- Tổng học phí: ${formatVND(options.feeAmount)}
- Hạn nộp: ${formatDateVN(options.dueDate)}

Quý phụ huynh vui lòng chuyển khoản qua ngân hàng:
- Ngân hàng: ${options.bankName}
- Số tài khoản: ${options.bankAccountNo}
- Tên chủ tài khoản: ${options.bankAccountName}
- Nội dung chuyển khoản: ${options.transferSyntax}

(Quý phụ huynh có thể quét mã VietQR trên phiếu thu để tự động điền đúng thông tin và số tiền).

Mọi thắc mắc xin vui lòng liên hệ Hotline: ${options.hotline}.
Trân trọng cảm ơn Quý phụ huynh!`;
}
