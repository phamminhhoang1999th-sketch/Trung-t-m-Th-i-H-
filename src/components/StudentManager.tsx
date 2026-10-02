import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  BookOpen,
  Calendar,
  Edit2,
  Trash2,
  Percent,
  DollarSign,
  CheckCircle2,
  History,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import {
  Student,
  Classroom,
  AttendanceSession,
  Invoice,
  MakeupRequest,
} from '../types';
import { formatDateVN, formatVND } from '../utils/vietqr';

interface StudentManagerProps {
  students: Student[];
  classes: Classroom[];
  attendance: AttendanceSession[];
  invoices: Invoice[];
  makeupRequests: MakeupRequest[];
  currentUser: import('../types').UserAccount;
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenNewMakeupForStudent: (studentId: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  classes,
  attendance,
  invoices,
  makeupRequests,
  currentUser,
  onSaveStudent,
  onDeleteStudent,
  onOpenNewMakeupForStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student history modal
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [customFeePerSession, setCustomFeePerSession] = useState<string>('');
  const [note, setNote] = useState('');

  const openAddModal = () => {
    setEditingStudent(null);
    const newSeq = String(students.length + 1).padStart(3, '0');
    setStudentCode(`TH-1${newSeq}`);
    setFullName('');
    setGender('Nam');
    setDateOfBirth('2011-01-01');
    setParentName('');
    setParentPhone('');
    setAddress('');
    setSelectedClassIds(classes.length > 0 ? [classes[0].id] : []);
    setCustomFeePerSession('');
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setStudentCode(student.id);
    setFullName(student.fullName);
    setGender(student.gender);
    setDateOfBirth(student.dateOfBirth);
    setParentName(student.parentName);
    setParentPhone(student.parentPhone);
    setAddress(student.address || '');
    setSelectedClassIds([...student.classIds]);
    setCustomFeePerSession(
      student.customFeePerSession && student.customFeePerSession > 0
        ? String(student.customFeePerSession)
        : ''
    );
    setNote(student.note || '');
    setIsModalOpen(true);
  };

  const handleToggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentCode.trim() || selectedClassIds.length === 0) {
      alert('Vui lòng nhập Họ tên, Mã học sinh và chọn ít nhất 1 lớp học!');
      return;
    }

    const parsedFee = customFeePerSession.trim() !== '' ? Number(customFeePerSession) : undefined;
    const studentToSave: Student = {
      id: studentCode.trim().toUpperCase(),
      fullName: fullName.trim(),
      gender,
      dateOfBirth,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      address: address.trim(),
      classIds: selectedClassIds,
      customFeePerSession: parsedFee && parsedFee > 0 ? parsedFee : undefined,
      discountPercent: 0,
      joinDate: editingStudent ? editingStudent.joinDate : new Date().toISOString().split('T')[0],
      status: 'active',
      note: note.trim(),
    };

    onSaveStudent(studentToSave);
    setIsModalOpen(false);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (classFilter !== 'all' && !s.classIds.includes(classFilter)) return false;
    if (searchTerm) {
      const nameMatch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const codeMatch = s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = s.parentPhone.includes(searchTerm);
      if (!nameMatch && !codeMatch && !phoneMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Danh Sách Học Sinh</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng {students.length} học sinh đang theo học tại Trung tâm Thái Hà.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-300 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm học sinh mới</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Lọc theo lớp:</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả các lớp ({students.length} học sinh)</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm theo tên, mã HS, SĐT phụ huynh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Student List Cards / Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chưa có học sinh nào
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm || classFilter !== 'all'
                ? 'Không tìm thấy học sinh phù hợp với bộ lọc hiện tại.'
                : 'Danh sách học sinh đang trống. Hãy thêm học sinh mới để phân vào các lớp học.'}
            </p>
          </div>
          {classes.length > 0 ? (
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-300 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm học sinh mới</span>
            </button>
          ) : (
            <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              Vui lòng tạo lớp học trước khi thêm học sinh.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
          const studentClasses = classes.filter((c) => student.classIds.includes(c.id));
          const studentMakeups = makeupRequests.filter((m) => m.studentId === student.id);

          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">
                        {student.fullName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {student.gender}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-indigo-700 mt-0.5">
                      {student.id}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(student)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Sửa học sinh"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xoá học sinh ${student.fullName}?`)) {
                          onDeleteStudent(student.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xoá học sinh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      PH: <strong className="text-slate-800">{student.parentName}</strong> (
                      <span className="font-mono">{student.parentPhone}</span>)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ngày sinh: {formatDateVN(student.dateOfBirth)}</span>
                  </div>

                  {/* Classes */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Lớp đang học:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {studentClasses.map((cls) => (
                        <span
                          key={cls.id}
                          className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md"
                        >
                          {cls.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {currentUser.permissions.canViewTuition && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {student.customFeePerSession && student.customFeePerSession > 0 ? (
                        <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-indigo-600" />
                          Học phí riêng: {formatVND(student.customFeePerSession)}/buổi
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          Học phí: Theo lớp chung
                        </span>
                      )}
                    </div>
                  )}

                  {student.note && (
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      "{student.note}"
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingStudent(student)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Xem hồ sơ</span>
                </button>
                <button
                  onClick={() => onOpenNewMakeupForStudent(student.id)}
                  className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xếp học bù</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Modal: Thêm / Sửa học sinh */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>{editingStudent ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã học sinh
                  </label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên học sinh
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Minh Trí"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ tên Phụ huynh
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại nhận thông báo & Zalo
                  </label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0912345678"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Lớp theo học (checkboxes) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Lớp theo học tại trung tâm (chọn 1 hoặc nhiều)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {classes.map((cls) => {
                    const isChecked = selectedClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleClass(cls.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-800">{cls.name}</span>
                        <span className="text-slate-400">({cls.schedule})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.permissions.canViewTuition ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Học phí 1 buổi của học sinh (VNĐ)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      placeholder="Để trống nếu tính theo lớp"
                      value={customFeePerSession}
                      onChange={(e) => setCustomFeePerSession(e.target.value)}
                      className="w-full text-xs font-semibold text-indigo-700 rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      * Để trống sẽ tự động tính theo học phí chung của lớp.
                    </p>
                  </div>
                ) : null}

                <div className={currentUser.permissions.canViewTuition ? '' : 'sm:col-span-2'}>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ nhà
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thái Hà, Đống Đa"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú học lực / mục tiêu
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về học lực hoặc tính cách của học sinh..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-300 active:scale-95"
                >
                  {editingStudent ? 'Cập nhật học sinh' : 'Lưu học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xem hồ sơ học sinh (Chuyên cần + Hoá đơn) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hồ sơ học sinh: {viewingStudent.fullName}
                </h3>
                <div className="text-slate-500 font-mono">Mã: {viewingStudent.id}</div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Attendance history */}
            <div>
              <div className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Lịch sử các buổi điểm danh gần đây</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {attendance
                  .filter((session) =>
                    session.records.some((r) => r.studentId === viewingStudent.id)
                  )
                  .map((session) => {
                    const record = session.records.find((r) => r.studentId === viewingStudent.id);
                    const cls = classes.find((c) => c.id === session.classId);

                    return (
                      <div
                        key={session.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {formatDateVN(session.date)} · {cls?.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {session.lessonTitle}
                          </div>
                        </div>

                        <div>
                          {record?.status === 'present' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Có mặt
                            </span>
                          )}
                          {record?.status === 'late' && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              Đi muộn
                            </span>
                          )}
                          {record?.status === 'absent_excused' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              Vắng có phép
                            </span>
                          )}
                          {record?.isMakeup && (
                            <span className="ml-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              Học bù
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Invoices (CHỈ HIỂN THỊ NẾU CÓ QUYỀN XEM HỌC PHÍ) */}
            {currentUser.permissions.canViewTuition && (
              <div className="pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Hoá đơn học phí đã phát hành</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {invoices
                    .filter((inv) => inv.studentId === viewingStudent.id)
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {inv.invoiceCode} ({inv.month})
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            CK: {inv.transferSyntax}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900">
                            {formatVND(inv.totalAmount)}
                          </div>
                          {inv.status === 'paid' ? (
                            <span className="text-[10px] font-bold text-emerald-600">Đã thanh toán</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600">Chờ thu</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
