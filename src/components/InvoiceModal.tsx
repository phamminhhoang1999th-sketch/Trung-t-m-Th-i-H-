import React, { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  Check,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Share2,
  Download,
} from 'lucide-react';
import {
  Invoice,
  Student,
  Classroom,
  CenterSettings,
} from '../types';
import {
  formatVND,
  formatDateVN,
  formatMonthVN,
  getVietQRImageUrl,
  generateQrDataUrl,
  generateParentMessage,
} from '../utils/vietqr';

interface InvoiceModalProps {
  invoice: Invoice | null;
  student?: Student;
  classroom?: Classroom;
  settings: CenterSettings;
  onClose: () => void;
  onMarkAsPaid: (invoiceId: string, method: 'vietqr' | 'cash' | 'transfer') => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  student,
  classroom,
  settings,
  onClose,
  onMarkAsPaid,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [fallbackQrDataUrl, setFallbackQrDataUrl] = useState<string>('');
  const [imgLoadError, setImgLoadError] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    setImgLoadError(false);

    // Generate local QR fallback data URL
    const qrPayload = `https://img.vietqr.io/image/${settings.bankId}-${settings.bankAccountNo}-compact2.png?amount=${invoice.totalAmount}&addInfo=${encodeURIComponent(invoice.transferSyntax)}&accountName=${encodeURIComponent(settings.bankAccountName)}`;
    generateQrDataUrl(qrPayload).then((dataUrl) => {
      setFallbackQrDataUrl(dataUrl);
    });
  }, [invoice, settings]);

  if (!invoice || !student || !classroom) return null;

  const vietQrUrl = getVietQRImageUrl({
    bankId: settings.bankId,
    accountNo: settings.bankAccountNo,
    accountName: settings.bankAccountName,
    amount: invoice.totalAmount,
    description: invoice.transferSyntax,
  });

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyZaloMessage = () => {
    const msg = generateParentMessage({
      studentName: student.fullName,
      studentCode: student.id,
      month: invoice.month,
      className: classroom.name,
      totalSessions: invoice.totalSessions,
      feeAmount: invoice.totalAmount,
      dueDate: invoice.dueDate,
      bankName: settings.bankName,
      bankAccountNo: settings.bankAccountNo,
      bankAccountName: settings.bankAccountName,
      transferSyntax: invoice.transferSyntax,
      hotline: settings.hotline,
    });
    handleCopyText(msg, 'zalo');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Action Top bar (hidden in print) */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-xs sm:text-sm truncate">Phiếu Thu Học Phí</span>
            <span className="text-[11px] text-slate-400 shrink-0 font-mono">({invoice.invoiceCode})</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In hoá đơn</span>
            </button>
            <button
              onClick={handleCopyZaloMessage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedType === 'zalo' ? 'Đã sao chép!' : 'Gửi Zalo'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 text-xs bg-white">
          {/* Header trung tâm */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                {settings.centerName}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {settings.brandTitle}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Địa chỉ: {settings.address}
              </div>
              <div className="text-[11px] text-slate-500">
                Hotline: <span className="font-bold text-slate-700">{settings.hotline}</span> · Email: {settings.email}
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-xs font-mono font-bold text-indigo-700">
                MÃ: {invoice.invoiceCode}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Ngày phát hành: {formatDateVN(invoice.issueDate)}
              </div>
              <div className="text-[11px] text-rose-600 font-semibold">
                Hạn đóng: {formatDateVN(invoice.dueDate)}
              </div>
              <div className="mt-1">
                {invoice.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ THANH TOÁN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                    CHỜ THANH TOÁN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tiêu đề phiếu */}
          <div className="text-center py-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
              PHIẾU BÁO HỌC PHÍ THÁNG {invoice.month.split('-')[1]}/{invoice.month.split('-')[0]}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Áp dụng cho học viên theo học tại Trung tâm Giáo dục Thái Hà
            </p>
          </div>

          {/* Thông tin học sinh */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Học sinh:</span>
                <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500">Mã học sinh:</span>
                <span className="font-mono font-bold text-indigo-700">{student.id}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500">Lớp đăng ký:</span>
                <span className="font-semibold text-slate-800">{classroom.name}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Phụ huynh:</span>
                <span className="font-semibold text-slate-900">{student.parentName}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono font-semibold text-slate-800">{student.parentPhone}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500">Lịch học cố định:</span>
                <span className="text-slate-700">{classroom.schedule}</span>
              </div>
            </div>
          </div>

          {/* Bảng kê học phí chi tiết */}
          <div>
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <th className="border border-slate-200 p-2.5">Nội dung chi tiết</th>
                  <th className="border border-slate-200 p-2.5 text-center">Số lượng</th>
                  <th className="border border-slate-200 p-2.5 text-right">Đơn giá</th>
                  <th className="border border-slate-200 p-2.5 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                <tr>
                  <td className="border border-slate-200 p-2.5">
                    <div className="font-semibold text-slate-900">
                      Học phí môn {classroom.subject} ({formatMonthVN(invoice.month)})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Lớp {classroom.name} · GV: {classroom.teacher}
                      {student.customFeePerSession && student.customFeePerSession > 0 ? (
                        <span className="text-indigo-600 font-semibold ml-1.5 bg-indigo-50 px-1.5 py-0.5 rounded">
                          (Áp dụng đơn giá riêng của học sinh)
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center font-medium">
                    <div className="font-bold text-slate-900">{invoice.totalSessions} buổi</div>
                    <div className="text-[10px] text-slate-500">(Thực tế đã học)</div>
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-medium">
                    {formatVND(invoice.feePerSession)}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-bold text-slate-900">
                    {formatVND(invoice.baseAmount)}
                  </td>
                </tr>

                {invoice.discountAmount > 0 && (
                  <tr className="bg-emerald-50/50">
                    <td className="border border-slate-200 p-2.5">
                      <div className="font-semibold text-emerald-800">
                        Ưu đãi học phí ({invoice.discountPercent}%)
                      </div>
                      <div className="text-[11px] text-emerald-600">
                        Học sinh học nhiều môn / Học bổng khuyến học Thái Hà
                      </div>
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center">
                      -
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right">
                      -
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right font-bold text-emerald-700">
                      -{formatVND(invoice.discountAmount)}
                    </td>
                  </tr>
                )}

                {invoice.makeupSessionsCount > 0 && (
                  <tr className="bg-indigo-50/40">
                    <td colSpan={3} className="border border-slate-200 p-2.5 text-[11px] text-indigo-900">
                      <span className="font-bold">Ghi nhận học bù:</span> Học sinh đã tham gia {invoice.makeupSessionsCount} buổi học bù trong tháng này (miễn phí theo quyền lợi).
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right font-bold text-indigo-700">
                      0 đ
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold">
                  <td colSpan={3} className="border border-slate-900 p-3 text-right uppercase text-xs">
                    Tổng số tiền thanh toán:
                  </td>
                  <td className="border border-slate-900 p-3 text-right text-base text-amber-300 font-extrabold">
                    {formatVND(invoice.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* KHU VỰC QUÉT MÃ VIETQR CHUYỂN KHOẢN (ĐIỂM NHẤN CỰC KỲ QUAN TRỌNG) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 border-2 border-indigo-200 shadow-xs print-shadow-none print-break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-indigo-700" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Chuyển Khoản Qua Quét Mã VietQR (Napas 247)
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-sm text-center shrink-0">
                <img
                  src={imgLoadError ? fallbackQrDataUrl : vietQrUrl}
                  alt="VietQR Code"
                  onError={() => setImgLoadError(true)}
                  className="w-44 h-auto max-h-56 object-contain mx-auto rounded-lg"
                />
                <div className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center justify-center gap-1">
                  <span>Quét bằng app ngân hàng bất kỳ</span>
                </div>
              </div>

              {/* Bank Details & Copy buttons */}
              <div className="flex-1 space-y-2.5 text-xs w-full">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {settings.bankName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-sm text-indigo-700">
                        {settings.bankAccountNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(settings.bankAccountNo, 'acc')}
                        className="no-print p-1 hover:bg-slate-100 rounded text-slate-500"
                        title="Sao chép STK"
                      >
                        {copiedType === 'acc' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {settings.bankAccountName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-extrabold text-indigo-700">
                      {formatVND(invoice.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {invoice.transferSyntax}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(invoice.transferSyntax, 'syntax')}
                        className="no-print p-1 hover:bg-slate-100 rounded text-slate-500"
                        title="Sao chép cú pháp CK"
                      >
                        {copiedType === 'syntax' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  * Hệ thống tự động nhận diện thanh toán khi chuyển khoản đúng cú pháp: <strong className="text-slate-800 font-mono">{invoice.transferSyntax}</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Footer ghi chú & chữ ký */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div className="text-slate-500 max-w-sm text-[11px]">
              {settings.invoiceFooterNote}
            </div>

            <div className="text-center sm:text-right shrink-0">
              <div className="text-slate-500 text-[11px]">
                Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </div>
              <div className="font-bold text-slate-900 mt-1">
                TRUNG TÂM GIÁO DỤC THÁI HÀ
              </div>
              <div className="text-[11px] text-slate-400 italic mt-8">
                (Ký, ghi rõ họ tên và đóng dấu)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Controls (no-print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' ? (
              <>
                <button
                  type="button"
                  onClick={() => onMarkAsPaid(invoice.id, 'vietqr')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận đã nhận VietQR</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMarkAsPaid(invoice.id, 'cash')}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors"
                >
                  Thu tiền mặt
                </button>
              </>
            ) : (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Đã thu học phí ({invoice.paymentMethod === 'vietqr' ? 'Qua VietQR' : 'Tiền mặt'}) ngày {formatDateVN(invoice.paymentDate || '')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
