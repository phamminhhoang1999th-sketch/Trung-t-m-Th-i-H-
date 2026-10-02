import React from 'react';
import {
  Users,
  CalendarCheck,
  Clock3,
  Receipt,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  QrCode,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Classroom,
  Student,
  AttendanceSession,
  MakeupRequest,
  Invoice,
} from '../types';
import { formatVND, formatDateVN } from '../utils/vietqr';
import { NavTab } from './Navbar';

interface DashboardProps {
  classes: Classroom[];
  students: Student[];
  attendance: AttendanceSession[];
  makeupRequests: MakeupRequest[];
  invoices: Invoice[];
  setActiveTab: (tab: NavTab) => void;
  onSelectClassForAttendance: (classId: string) => void;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onOpenNewMakeupModal: () => void;
  currentMonth: string;
  currentUser: import('../types').UserAccount;
}

export const Dashboard: React.FC<DashboardProps> = ({
  classes,
  students,
  attendance,
  makeupRequests,
  invoices,
  setActiveTab,
  onSelectClassForAttendance,
  onOpenInvoiceModal,
  onOpenNewMakeupModal,
  currentMonth,
  currentUser,
}) => {
  const canViewTuition = currentUser.permissions.canViewTuition;
  const isTeacher = currentUser.role === 'teacher';
  
  // Lọc lớp theo giáo viên nếu là teacher
  const teacherClasses = isTeacher && currentUser.assignedClassIds.length > 0
    ? classes.filter((c) => currentUser.assignedClassIds.includes(c.id))
    : classes;

  const activeStudents = students.filter((s) => s.status === 'active');
  const pendingMakeups = makeupRequests.filter((m) => m.status === 'pending');
  const scheduledMakeups = makeupRequests.filter((m) => m.status === 'scheduled');

  // Month Invoices
  const monthInvoices = invoices.filter((i) => i.month === currentMonth);
  const totalExpectedRevenue = monthInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCollectedRevenue = monthInvoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPendingRevenue = totalExpectedRevenue - totalCollectedRevenue;
  const collectionRate = totalExpectedRevenue > 0
    ? Math.round((totalCollectedRevenue / totalExpectedRevenue) * 100)
    : 0;

  // Attendance stats for current month
  const monthAttendance = attendance.filter((a) => a.date.startsWith(currentMonth));
  let totalRecords = 0;
  let presentRecords = 0;
  monthAttendance.forEach((session) => {
    session.records.forEach((rec) => {
      totalRecords++;
      if (rec.status === 'present' || rec.status === 'late' || rec.isMakeup) {
        presentRecords++;
      }
    });
  });
  const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 100;

  // Lịch dạy hôm nay (dựa vào ngày trong tuần)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0: CN, 1: T2, 2: T3, ...
  const todayDateStr = today.toISOString().split('T')[0];

  const todayClasses = classes.filter((c) => c.scheduleDays.includes(dayOfWeek));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Hệ thống Quản lý Trung tâm</span>
              <span>·</span>
              <span>Hà Nội, {formatDateVN(todayDateStr)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trung Tâm Giáo Dục Thái Hà
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Quản lý điểm danh thông minh, tự động xếp lịch học bù và xuất hoá đơn học phí tích hợp mã VietQR ngân hàng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('attendance')}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Điểm danh hôm nay</span>
            </button>
            <button
              onClick={onOpenNewMakeupModal}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Đăng ký học bù</span>
            </button>
            {canViewTuition ? (
              <button
                onClick={() => setActiveTab('invoices')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Học phí VietQR</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('classes')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>Lớp phụ trách</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Học sinh & Lớp */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isTeacher ? 'Học sinh lớp phụ trách' : 'Học sinh & Lớp học'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeStudents.length}</span>
            <span className="text-xs text-slate-500">học sinh đang theo học</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">{teacherClasses.length} lớp học</span>
            <span>·</span>
            <span>{isTeacher ? 'Phân công phụ trách' : 'Toán, Anh, Văn, Lý'}</span>
          </div>
        </div>

        {/* Tỷ lệ Chuyên cần */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chuyên cần tháng {currentMonth.split('-')[1]}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{attendanceRate}%</span>
            <span className="text-xs text-slate-500">tỷ lệ đi học</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span>{monthAttendance.length} buổi đã điểm danh</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">Chăm chỉ</span>
          </div>
        </div>

        {/* Học bù & Đổi ca */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Yêu cầu học bù
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{pendingMakeups.length}</span>
            <span className="text-xs text-slate-500">chờ xếp lịch bù</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">{scheduledMakeups.length}</span>
            <span>đã lên lịch</span>
            <span>·</span>
            <button
              onClick={() => setActiveTab('makeup')}
              className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center"
            >
              Chi tiết
            </button>
          </div>
        </div>

        {/* Card 4: Doanh thu học phí (NẾU ĐƯỢC PHÂN QUYỀN) hoặc Buổi dạy hoàn thành (NẾU LÀ GIÁO VIÊN) */}
        {canViewTuition ? (
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Học phí tháng {currentMonth.split('-')[1]}
              </span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{formatVND(totalCollectedRevenue)}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Còn thu: {formatVND(totalPendingRevenue)}</span>
              <span className="font-semibold text-indigo-600">{collectionRate}%</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lớp giảng dạy
              </span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{teacherClasses.length}</span>
              <span className="text-xs text-slate-500">lớp được phân công</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Quyền hạn: Giáo viên</span>
              <span className="text-xs text-emerald-600 font-semibold">Đang hoạt động</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Row: Today's Classes & Pending Makeup Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2/3): Lớp học có lịch hôm nay / Lớp học gần nhất */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Lớp học & Điểm danh ngày hôm nay
                </h2>
                <p className="text-xs text-slate-500">
                  {todayClasses.length > 0
                    ? `Có ${todayClasses.length} ca học diễn ra trong ngày hôm nay`
                    : 'Hôm nay không có ca học cố định. Bạn có thể chọn bất kỳ lớp nào để điểm danh.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Tất cả lớp học
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List classes for attendance */}
            <div className="space-y-3">
              {(todayClasses.length > 0 ? todayClasses : classes.slice(0, 3)).map((cls) => {
                const classStudents = students.filter(
                  (s) => s.status === 'active' && s.classIds.includes(cls.id)
                );
                const isAttendedToday = attendance.some(
                  (a) => a.classId === cls.id && a.date === todayDateStr
                );

                return (
                  <div
                    key={cls.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-all gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {cls.grade}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {cls.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>GV: {cls.teacher}</span>
                          <span>·</span>
                          <span>{cls.room}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">{cls.schedule}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Sĩ số</div>
                        <div className="text-xs font-bold text-slate-800">
                          {classStudents.length} học sinh
                        </div>
                      </div>

                      {isAttendedToday ? (
                        <button
                          onClick={() => onSelectClassForAttendance(cls.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã điểm danh</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectClassForAttendance(cls.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 shadow-xs"
                        >
                          <CalendarCheck className="w-4 h-4" />
                          <span>Điểm danh</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Invoices Widget (ONLY FOR ADMIN & MANAGER) or Teacher Sessions Widget */}
          {canViewTuition ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Hoá đơn học phí cần theo dõi (Tháng {currentMonth.split('-')[1]})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Quét mã QR VietQR hoặc copy tin nhắn gửi phụ huynh chuyển khoản
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Xem tất cả hoá đơn
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-2.5">Học sinh</th>
                      <th className="pb-2.5">Lớp</th>
                      <th className="pb-2.5">Số tiền</th>
                      <th className="pb-2.5">Trạng thái</th>
                      <th className="pb-2.5 text-right">Mã QR VietQR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthInvoices.slice(0, 4).map((inv) => {
                      const student = students.find((s) => s.id === inv.studentId);
                      const cls = classes.find((c) => c.id === inv.classId);

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 font-medium text-slate-900">
                            <div>{student?.fullName || inv.studentId}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {student?.parentPhone}
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 max-w-[140px] truncate">
                            {cls?.name || inv.classId}
                          </td>
                          <td className="py-3 font-semibold text-slate-900">
                            {formatVND(inv.totalAmount)}
                          </td>
                          <td className="py-3">
                            {inv.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Đã đóng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <AlertCircle className="w-3 h-3" /> Chờ thu
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => onOpenInvoiceModal(inv)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Mã VietQR</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Lịch sử điểm danh các buổi dạy gần đây
                  </h2>
                  <p className="text-xs text-slate-500">
                    Theo dõi tiến độ bài giảng & bài tập về nhà
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Xem chi tiết
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {attendance.slice(0, 3).map((att) => {
                  const cls = classes.find((c) => c.id === att.classId);
                  const pCount = att.records.filter((r) => r.status === 'present').length;
                  return (
                    <div key={att.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{cls?.name} · {formatDateVN(att.date)}</div>
                        <div className="text-[11px] text-slate-500">{att.lessonTitle}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {pCount} học sinh có mặt
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col (1/3): Yêu cầu học bù & Đổi lịch */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Lịch học bù cần xử lý
                </h2>
                <p className="text-xs text-slate-500">
                  Học sinh nghỉ có phép cần xếp bù
                </p>
              </div>
              <button
                onClick={onOpenNewMakeupModal}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md"
                title="Đăng ký ca bù mới"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {makeupRequests.slice(0, 4).map((item) => {
                const student = students.find((s) => s.id === item.studentId);
                const origClass = classes.find((c) => c.id === item.originalClassId);
                const makeupClass = classes.find((c) => c.id === item.makeupClassId);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {student?.fullName}
                      </span>
                      {item.status === 'pending' && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Chờ xếp lịch
                        </span>
                      )}
                      {item.status === 'scheduled' && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          Đã xếp lịch
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          Đã học bù
                        </span>
                      )}
                    </div>

                    <div className="text-slate-600 space-y-1">
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Lớp gốc:</span>
                        <span className="font-medium text-slate-700">{origClass?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Buổi vắng:</span>
                        <span className="text-rose-600 font-medium">
                          {formatDateVN(item.missedDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Học bù sang:</span>
                        <span className="text-indigo-600 font-medium">
                          {makeupClass?.name} ({formatDateVN(item.targetDate)})
                        </span>
                      </div>
                      <div className="text-slate-500 italic mt-1 bg-white p-1.5 rounded border border-slate-200/60">
                        "{item.reason}"
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab('makeup')}
              className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center"
            >
              Xem tất cả danh sách học bù
            </button>
          </div>

          {/* Quick Info Center Card */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Chính sách học bù Thái Hà</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              1. Học sinh vắng có phép được đăng ký học bù sang các lớp có cùng chuyên đề hoặc lớp song song miễn phí.
            </p>
            <p className="text-slate-300 leading-relaxed">
              2. Khi giáo viên điểm danh tại lớp học bù, hệ thống tự động cập nhật trạng thái "Đã học bù" và lưu vào hồ sơ chuyên cần.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Hotline hỗ trợ xếp lịch: <span className="text-white font-semibold">0988.567.890</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
