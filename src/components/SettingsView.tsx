import React, { useState } from 'react';
import {
  Settings,
  Building2,
  CreditCard,
  Save,
  CheckCircle2,
  QrCode,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { CenterSettings, UserAccount } from '../types';
import { POPULAR_BANKS, getVietQRImageUrl, formatVND } from '../utils/vietqr';
import { Storage } from '../utils/storage';

interface SettingsViewProps {
  settings: CenterSettings;
  currentUser: UserAccount;
  onSaveSettings: (settings: CenterSettings) => void;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onSaveSettings,
  onRefreshData,
}) => {
  const canManageBank = currentUser.role === 'admin' || currentUser.role === 'manager';

  const [formData, setFormData] = useState<CenterSettings>({ ...settings });
  const [testAmount, setTestAmount] = useState<number>(1200000);
  const [testSyntax, setTestSyntax] = useState<string>('THAIHA TEST 2026');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof CenterSettings, val: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleBankChange = (bankId: string) => {
    if (!canManageBank) return;
    const selectedBank = POPULAR_BANKS.find((b) => b.id === bankId);
    if (selectedBank) {
      setFormData((prev) => ({
        ...prev,
        bankId: selectedBank.id,
        bankName: `${selectedBank.shortName} (${selectedBank.name})`,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Nếu không phải admin hoặc manager, giữ nguyên thông tin ngân hàng cũ để bảo mật
    const dataToSave: CenterSettings = canManageBank
      ? formData
      : {
          ...formData,
          bankId: settings.bankId,
          bankName: settings.bankName,
          bankAccountNo: settings.bankAccountNo,
          bankAccountName: settings.bankAccountName,
          transferPrefix: settings.transferPrefix,
        };

    onSaveSettings(dataToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const json = Storage.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_trungtamthaiha_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && Storage.importBackup(content)) {
        alert('Khôi phục dữ liệu sao lưu thành công!');
        onRefreshData();
      } else {
        alert('Tệp dữ liệu không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu mẫu ban đầu của Trung tâm Thái Hà?')) {
      Storage.resetToDefault();
      onRefreshData();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  // Preview VietQR image URL
  const previewQrUrl = getVietQRImageUrl({
    bankId: formData.bankId,
    accountNo: formData.bankAccountNo,
    accountName: formData.bankAccountName,
    amount: testAmount,
    description: testSyntax,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Cấu Hình Trung Tâm & Tài Khoản Ngân Hàng VietQR</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tuỳ chỉnh thông tin hiển thị trên hoá đơn, cấu hình số tài khoản ngân hàng nhận học phí qua mã VietQR Napas247.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col (2/3): Center & Bank Info Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Center Information */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>1. Thông tin Trung tâm Giáo dục Thái Hà</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Trung tâm
                  </label>
                  <input
                    type="text"
                    value={formData.centerName}
                    onChange={(e) => handleChange('centerName', e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Khẩu hiệu / Slogan thương hiệu
                  </label>
                  <input
                    type="text"
                    value={formData.brandTitle}
                    onChange={(e) => handleChange('brandTitle', e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Địa chỉ trụ sở
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hotline tuyển sinh & CSKH
                  </label>
                  <input
                    type="text"
                    value={formData.hotline}
                    onChange={(e) => handleChange('hotline', e.target.value)}
                    className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ghi chú chân hoá đơn
                  </label>
                  <textarea
                    rows={2}
                    value={formData.invoiceFooterNote}
                    onChange={(e) => handleChange('invoiceFooterNote', e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Banking / VietQR Information (CHỈ ADMIN VÀ QUẢN LÝ MỚI XEM VÀ CHỈNH SỬA ĐƯỢC) */}
            {canManageBank ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>2. Cấu hình Ngân hàng nhận thanh toán VietQR</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Admin & Quản lý
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Chọn Ngân hàng
                    </label>
                    <select
                      value={formData.bankId}
                      onChange={(e) => handleBankChange(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.shortName} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số tài khoản ngân hàng (STK)
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountNo}
                      onChange={(e) => handleChange('bankAccountNo', e.target.value)}
                      placeholder="Ví dụ: 0988567890"
                      className="w-full text-xs font-mono font-bold text-indigo-700 rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tên chủ tài khoản (Viết hoa không dấu)
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountName}
                      onChange={(e) => handleChange('bankAccountName', e.target.value.toUpperCase())}
                      placeholder="Ví dụ: TRUNG TAM GIAO DUC THAI HA"
                      className="w-full text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tiền tố nội dung chuyển khoản
                    </label>
                    <input
                      type="text"
                      value={formData.transferPrefix}
                      onChange={(e) => handleChange('transferPrefix', e.target.value.toUpperCase())}
                      placeholder="Ví dụ: THAIHA"
                      className="w-full text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Cú pháp tạo ra: <span className="font-mono text-indigo-700 font-bold">{formData.transferPrefix} [MÃ_HS] T[THÁNG]</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>2. Cấu hình Ngân hàng nhận thanh toán VietQR</span>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    Quyền hạn giới hạn: Mục Tài khoản Ngân hàng được bảo mật
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Chỉ <strong>Admin</strong> và <strong>Quản lý</strong> mới có quyền xem và chỉnh sửa thông tin tài khoản ngân hàng của trung tâm. Giáo viên không được phép xem hoặc thay đổi mục này.
                  </p>
                </div>
              </div>
            )}

            {/* Save Buttons & Alert */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-300 transition-all flex items-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thông tin</span>
              </button>

              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã lưu thành công!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Col (1/3): Live VietQR Code Preview & Backup Controls */}
          <div className="space-y-6">
            {/* Live VietQR Preview (CHỈ HIỂN THỊ NẾU LÀ ADMIN HOẶC QUẢN LÝ) */}
            {canManageBank ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Mã VietQR Demo Trực Tiếp</span>
                </div>

                <div className="text-xs text-slate-500">
                  Thử quét mã QR này bằng bất kỳ app ngân hàng nào (MBBank, Vietcombank, Techcombank...) để kiểm tra độ chính xác:
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-indigo-100 text-center">
                  <img
                    src={previewQrUrl}
                    alt="VietQR Test"
                    className="w-48 h-auto max-h-60 mx-auto rounded-lg shadow-xs"
                  />
                  <div className="mt-2 text-[11px] font-mono font-bold text-indigo-700">
                    {formData.bankName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    STK: {formData.bankAccountNo} · {formData.bankAccountName}
                  </div>
                </div>

                {/* Interactive test controls */}
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Số tiền test (VNĐ):
                    </label>
                    <input
                      type="number"
                      step="50000"
                      value={testAmount}
                      onChange={(e) => setTestAmount(Number(e.target.value))}
                      className="w-full text-xs font-bold rounded-lg border border-slate-200 p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Nội dung chuyển khoản test:
                    </label>
                    <input
                      type="text"
                      value={testSyntax}
                      onChange={(e) => setTestSyntax(e.target.value)}
                      className="w-full text-xs font-mono rounded-lg border border-slate-200 p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3 text-xs">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Trung Tâm Giáo Dục Thái Hà</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Hệ thống quản lý chuyên môn và nghiệp vụ giáo dục chất lượng cao. Thông tin tài chính được bảo mật theo quy định trung tâm.
                </p>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                  <div className="font-bold text-indigo-950 text-xs">{settings.centerName}</div>
                  <div className="text-slate-600 text-[11px]">{settings.address}</div>
                  <div className="text-indigo-700 font-bold text-[11px]">Hotline: {settings.hotline}</div>
                </div>
              </div>
            )}

            {/* Backup & Restore Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Sao lưu & Phục hồi dữ liệu</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Lưu trữ toàn bộ danh sách điểm danh, học sinh, lớp học và hoá đơn an toàn trên máy tính của bạn.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất file sao lưu (JSON)</span>
                </button>

                <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nhập file khôi phục (JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại dữ liệu mẫu ban đầu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
