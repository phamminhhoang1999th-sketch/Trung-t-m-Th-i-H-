import React, { useState } from 'react';
import {
  Receipt,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Filter,
  DollarSign,
  Search,
  Check,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
} from 'lucide-react';
import {
  Invoice,
  Student,
  Classroom,
  PaymentStatus,
  CenterSettings,
} from '../types';
import { formatVND, formatDateVN, formatMonthVN } from '../utils/vietqr';

interface InvoiceViewProps {
  invoices: Invoice[];
  students: Student[];
  classes: Classroom[];
  settings: CenterSettings;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  onGenerateMonthlyInvoices: (month: string) => void;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onMarkAsPaid: (invoiceId: string, method: 'vietqr' | 'cash' | 'transfer') => void;
  onDeleteInvoice: (invoiceId: string) => void;
  currentUser: import('../types').UserAccount;
  onGoToDashboard?: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoices,
  students,
  classes,
  settings,
  currentMonth,
  setCurrentMonth,
  onGenerateMonthlyInvoices,
  onOpenInvoiceModal,
  onMarkAsPaid,
  onDeleteInvoice,
  currentUser,
  onGoToDashboard,
}) => {
  // BẢO MẬT: CHỈ ADMIN VÀ QUẢN LÝ MỚI XEM ĐƯỢC HỌC PHÍ
  if (!currentUser.permissions.canViewTuition) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Quyền truy cập bị giới hạn
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Chỉ <strong>Admin</strong> và <strong>Quản lý</strong> mới có quyền xem thông tin học phí, doanh thu và hoá đơn thanh toán của học sinh. Tài khoản của bạn hiện là <span className="font-semibold text-indigo-700">Giáo viên</span>.
        </p>
        <p className="text-[11px] text-slate-400">
          Vui lòng liên hệ Admin trung tâm nếu bạn cần phân quyền thêm.
        </p>
        {onGoToDashboard && (
          <button
            onClick={onGoToDashboard}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            Quay lại Tổng quan
          </button>
        )}
      </div>
    );
  }

  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [calcNotice, setCalcNotice] = useState<string | null>(null);

  // Month filtered invoices
  const monthInvoices = invoices.filter((inv) => inv.month === currentMonth);

  // Apply filters
  const filteredInvoices = monthInvoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (classFilter !== 'all' && inv.classId !== classFilter) return false;
    if (searchTerm) {
      const student = students.find((s) => s.id === inv.studentId);
      const nameMatch = student?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const codeMatch = student?.id.toLowerCase().includes(searchTerm.toLowerCase());
      const syntaxMatch = inv.transferSyntax.toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch && !codeMatch && !syntaxMatch) return false;
    }
    return true;
  });

  // Calculate statistics for the active month
  const totalAmount = monthInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = monthInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPending = totalAmount - totalPaid;
  const paidCount = monthInvoices.filter((i) => i.status === 'paid').length;
  const pendingCount = monthInvoices.filter((i) => i.status !== 'paid').length;
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const handleRunCalculate = () => {
    onGenerateMonthlyInvoices(currentMonth);
    setCalcNotice(`Đã tự động tính và đồng bộ hoá đơn học phí tháng ${formatMonthVN(currentMonth)} thành công!`);
    setTimeout(() => setCalcNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Học Phí Hằng Tháng & Hoá Đơn VietQR</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động tính học phí theo buổi chuyên cần, tạo mã QR ngân hàng chuẩn Napas247 cho phụ huynh chuyển khoản.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none pr-2 cursor-pointer"
            />
          </div>

          <button
            onClick={handleRunCalculate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-300 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Tự động tính học phí tháng này</span>
          </button>
        </div>
      </div>

      {/* Success notification alert */}
      {calcNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{calcNotice}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tổng học phí ({formatMonthVN(currentMonth)})
          </span>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            {formatVND(totalAmount)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Tổng cộng {monthInvoices.length} hoá đơn
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Đã thu thành công
          </span>
          <div className="mt-2 text-xl font-extrabold text-emerald-600">
            {formatVND(totalPaid)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>{paidCount} học sinh đã đóng</span>
            <span className="font-bold text-emerald-700">{collectionRate}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Chưa thu / Đang chờ
          </span>
          <div className="mt-2 text-xl font-extrabold text-amber-600">
            {formatVND(totalPending)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {pendingCount} học sinh chưa thanh toán
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold">
            <QrCode className="w-4 h-4" />
            <span>Tài khoản VietQR</span>
          </div>
          <div className="text-xs font-semibold text-white truncate">
            {settings.bankName}
          </div>
          <div className="text-xs font-mono text-indigo-200 font-bold">
            STK: {settings.bankAccountNo}
          </div>
          <div className="text-[10px] text-slate-400 uppercase truncate">
            {settings.bankAccountName}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Status segmented buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({monthInvoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>Chờ thu</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>Đã thu</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {paidCount}
            </span>
          </button>
        </div>

        {/* Class Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả các lớp</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, cú pháp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 sm:w-60 text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-3.5">Mã hoá đơn</th>
                <th className="p-3.5">Học sinh & Phụ huynh</th>
                <th className="p-3.5">Lớp học</th>
                <th className="p-3.5 text-center">Buổi học</th>
                <th className="p-3.5 text-right">Tổng học phí</th>
                <th className="p-3.5">Cú pháp VietQR</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 text-xs">
                    {monthInvoices.length === 0 ? (
                      <div className="space-y-2">
                        <div>Chưa có dữ liệu hoá đơn cho tháng {formatMonthVN(currentMonth)}.</div>
                        <button
                          onClick={handleRunCalculate}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                        >
                          Bấm vào đây để tự động tính học phí ngay
                        </button>
                      </div>
                    ) : (
                      'Không tìm thấy hoá đơn nào phù hợp với bộ lọc.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const student = students.find((s) => s.id === inv.studentId);
                  const cls = classes.find((c) => c.id === inv.classId);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Mã hoá đơn */}
                      <td className="p-3.5 font-mono font-bold text-slate-700">
                        {inv.invoiceCode}
                      </td>

                      {/* Học sinh */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {student?.fullName || inv.studentId}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>Mã: {student?.id}</span>
                          <span>·</span>
                          <span className="font-mono">{student?.parentPhone}</span>
                        </div>
                      </td>

                      {/* Lớp */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">
                          {cls?.name || inv.classId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatVND(inv.feePerSession)}/buổi
                        </div>
                      </td>

                      {/* Buổi học & Học bù */}
                      <td className="p-3.5 text-center">
                        <div className="font-bold text-slate-800">
                          {inv.totalSessions} buổi
                        </div>
                        {inv.makeupSessionsCount > 0 && (
                          <div className="text-[10px] text-indigo-600 font-semibold">
                            (Bù {inv.makeupSessionsCount} buổi)
                          </div>
                        )}
                      </td>

                      {/* Tổng tiền */}
                      <td className="p-3.5 text-right">
                        <div className="font-extrabold text-sm text-slate-900">
                          {formatVND(inv.totalAmount)}
                        </div>
                        {inv.discountPercent > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Giảm {inv.discountPercent}%
                          </div>
                        )}
                      </td>

                      {/* Cú pháp VietQR */}
                      <td className="p-3.5">
                        <div className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200/60 inline-block">
                          {inv.transferSyntax}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3.5">
                        {inv.status === 'paid' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Đã thu
                            </span>
                            {inv.paymentMethod && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {inv.paymentMethod === 'vietqr' ? 'Qua VietQR' : 'Tiền mặt'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3" /> Chờ thu
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút xem phiếu & mã QR */}
                          <button
                            onClick={() => onOpenInvoiceModal(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition-colors shadow-2xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mã VietQR</span>
                          </button>

                          {/* Quick toggle paid */}
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => onMarkAsPaid(inv.id, 'vietqr')}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                              title="Đánh dấu đã nhận chuyển khoản VietQR"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (Dedicated for smartphone screens) */}
      <div className="block md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            {monthInvoices.length === 0 ? (
              <div className="space-y-3">
                <div>Chưa có dữ liệu hoá đơn cho tháng {formatMonthVN(currentMonth)}.</div>
                <button
                  onClick={handleRunCalculate}
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Tự động tính học phí ngay
                </button>
              </div>
            ) : (
              'Không tìm thấy hoá đơn nào phù hợp với bộ lọc.'
            )}
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const student = students.find((s) => s.id === inv.studentId);
            const cls = classes.find((c) => c.id === inv.classId);

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3"
              >
                {/* Header row: Code & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {inv.invoiceCode}
                  </span>

                  {inv.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Đã thu ({inv.paymentMethod === 'vietqr' ? 'VietQR' : 'Tiền mặt'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3 h-3" /> Chờ thanh toán
                    </span>
                  )}
                </div>

                {/* Student Info & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-slate-900 text-base">
                      {student?.fullName || inv.studentId}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span>Mã: {student?.id}</span> · <span>{student?.parentPhone}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 mt-1">
                      {cls?.name} · <span className="text-indigo-700 font-bold">{inv.totalSessions} buổi</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400">Tổng tiền</div>
                    <div className="text-base font-black text-slate-900">
                      {formatVND(inv.totalAmount)}
                    </div>
                    {inv.discountPercent > 0 && (
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Giảm {inv.discountPercent}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer syntax bar */}
                <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                  <span className="text-slate-500 text-[11px]">Cú pháp CK:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {inv.transferSyntax}
                  </span>
                </div>

                {/* Mobile action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onOpenInvoiceModal(inv)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Mã VietQR</span>
                  </button>

                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => onMarkAsPaid(inv.id, 'vietqr')}
                      className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-transform flex items-center gap-1 shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>Đã thu</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
