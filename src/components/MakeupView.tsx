import React, { useState } from 'react';
import {
  Clock3,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Filter,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  Classroom,
  Student,
  MakeupRequest,
  MakeupStatus,
} from '../types';
import { formatDateVN } from '../utils/vietqr';

interface MakeupViewProps {
  classes: Classroom[];
  students: Student[];
  makeupRequests: MakeupRequest[];
  onSaveMakeupRequest: (request: MakeupRequest) => void;
  onUpdateStatus: (requestId: string, status: MakeupStatus) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  prefillData?: {
    studentId?: string;
    originalClassId?: string;
    missedDate?: string;
  } | null;
}

export const MakeupView: React.FC<MakeupViewProps> = ({
  classes,
  students,
  makeupRequests,
  onSaveMakeupRequest,
  onUpdateStatus,
  isCreateModalOpen,
  setIsCreateModalOpen,
  prefillData,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | MakeupStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for new makeup request
  const [studentId, setStudentId] = useState(prefillData?.studentId || '');
  const [originalClassId, setOriginalClassId] = useState(prefillData?.originalClassId || '');
  const [missedDate, setMissedDate] = useState(
    prefillData?.missedDate || new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');
  const [makeupClassId, setMakeupClassId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  // If student changes, update originalClassId default
  const handleStudentChange = (id: string) => {
    setStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu && stu.classIds.length > 0) {
      setOriginalClassId(stu.classIds[0]);
      // Recommend a parallel class if possible
      const origClass = classes.find((c) => c.id === stu.classIds[0]);
      if (origClass) {
        const parallel = classes.find(
          (c) => c.id !== origClass.id && c.subject === origClass.subject
        );
        if (parallel) {
          setMakeupClassId(parallel.id);
        } else {
          setMakeupClassId(origClass.id);
        }
      }
    }
  };

  // Submit new request
  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !originalClassId || !missedDate || !makeupClassId || !targetDate) {
      alert('Vui lòng điền đầy đủ các thông tin cần thiết!');
      return;
    }

    const newRequest: MakeupRequest = {
      id: `MK-${Date.now().toString().slice(-6)}`,
      studentId,
      originalClassId,
      missedDate,
      reason: reason || 'Nghỉ có phép, đổi lịch học',
      makeupClassId,
      targetDate,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      notes,
    };

    onSaveMakeupRequest(newRequest);
    setIsCreateModalOpen(false);

    // reset
    setStudentId('');
    setOriginalClassId('');
    setReason('');
    setMakeupClassId('');
    setTargetDate('');
    setNotes('');
  };

  // Filtered requests
  const filteredRequests = makeupRequests
    .filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (searchTerm) {
        const student = students.find((s) => s.id === req.studentId);
        const nameMatch = student?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const codeMatch = student?.id.toLowerCase().includes(searchTerm.toLowerCase());
        const reasonMatch = req.reason.toLowerCase().includes(searchTerm.toLowerCase());
        if (!nameMatch && !codeMatch && !reasonMatch) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const countPending = makeupRequests.filter((m) => m.status === 'pending').length;
  const countScheduled = makeupRequests.filter((m) => m.status === 'scheduled').length;
  const countCompleted = makeupRequests.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Học Bù & Đổi Ca Học</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xử lý yêu cầu xin nghỉ có phép, xếp học bù sang lớp song song và đồng bộ tự động với bảng điểm danh.
          </p>
        </div>

        <button
          onClick={() => {
            // set default values if available
            if (students.length > 0 && !studentId) {
              handleStudentChange(students[0].id);
            }
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-300 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Đăng ký ca học bù mới</span>
        </button>
      </div>

      {/* Filter Tabs & Stats Bar */}
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
            Tất cả ({makeupRequests.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>Chờ xếp lịch</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {countPending}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'scheduled'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>Đã xếp lịch</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {countScheduled}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>Đã hoàn thành</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {countCompleted}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, lý do..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Requests Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            Không tìm thấy yêu cầu học bù nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const student = students.find((s) => s.id === req.studentId);
            const origClass = classes.find((c) => c.id === req.originalClassId);
            const makeupClass = classes.find((c) => c.id === req.makeupClassId);

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {req.id}
                    </span>
                    {req.status === 'pending' && (
                      <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Chờ xếp lịch
                      </span>
                    )}
                    {req.status === 'scheduled' && (
                      <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Đã xếp lịch bù
                      </span>
                    )}
                    {req.status === 'completed' && (
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã học bù xong
                      </span>
                    )}
                    {req.status === 'cancelled' && (
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        Đã huỷ
                      </span>
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="mt-3">
                    <div className="font-bold text-slate-900 text-base">
                      {student?.fullName || req.studentId}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Mã: {student?.id}</span>
                      <span>·</span>
                      <span>SĐT: {student?.parentPhone}</span>
                    </div>
                  </div>

                  {/* Class Transfer Comparison Card */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">
                        Buổi nghỉ tại lớp gốc
                      </div>
                      <div className="font-semibold text-slate-800">
                        {origClass?.name}
                      </div>
                      <div className="text-rose-600 font-medium flex items-center gap-1 mt-0.5">
                        <span>Ngày vắng: {formatDateVN(req.missedDate)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-indigo-600" />
                        <span>Chuyển sang học bù tại</span>
                      </div>
                      <div className="font-bold text-indigo-700">
                        {makeupClass?.name}
                      </div>
                      <div className="text-indigo-900 font-medium mt-0.5">
                        Ngày học bù: <span className="font-bold">{formatDateVN(req.targetDate)}</span> ({makeupClass?.schedule})
                      </div>
                    </div>
                  </div>

                  {/* Reason & notes */}
                  <div className="mt-3 text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    <span className="font-semibold text-amber-900">Lý do:</span> {req.reason}
                    {req.notes && (
                      <div className="mt-1 text-slate-500 italic">
                        Ghi chú: {req.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {req.status === 'pending' && (
                    <button
                      onClick={() => onUpdateStatus(req.id, 'scheduled')}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận xếp lịch này</span>
                    </button>
                  )}

                  {req.status === 'scheduled' && (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => onUpdateStatus(req.id, 'completed')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã học xong</span>
                      </button>
                      <button
                        onClick={() => onUpdateStatus(req.id, 'cancelled')}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                        title="Huỷ ca này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {req.status === 'completed' && (
                    <div className="w-full text-center text-emerald-700 font-semibold text-[11px] py-1 bg-emerald-50 rounded-md">
                      ✓ Đã hoàn tất buổi học bù
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Đăng ký ca học bù mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-indigo-600" />
                <span>Đăng ký ca học bù & đổi lịch</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-4 text-xs">
              {/* Chọn học sinh */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Học sinh đăng ký học bù
                </label>
                <select
                  value={studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id}) - Lớp: {s.classIds.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lớp gốc và ngày vắng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Lớp học chính
                  </label>
                  <select
                    value={originalClassId}
                    onChange={(e) => setOriginalClassId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Chọn lớp gốc --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Buổi vắng / Nghỉ ngày
                  </label>
                  <input
                    type="date"
                    value={missedDate}
                    onChange={(e) => setMissedDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Lý do vắng */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  4. Lý do xin nghỉ / xin học bù
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bị sốt xuất huyết / Trùng lịch kiểm tra ở trường / Gia đình bận..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Xếp vào lớp học bù nào & ngày nào */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
                <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Xếp lịch lớp học bù sang</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lớp tham gia học bù
                    </label>
                    <select
                      value={makeupClassId}
                      onChange={(e) => setMakeupClassId(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-indigo-200 bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Chọn lớp bù --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.schedule})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ngày đi học bù
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-indigo-200 bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Ghi chú thêm */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú cho giáo viên / trung tâm
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm nếu có..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-300 active:scale-95"
                >
                  Lưu & Xếp lịch học bù
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
