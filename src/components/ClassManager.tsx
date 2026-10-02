import React, { useState } from 'react';
import {
  BookOpen,
  PlusCircle,
  Users,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  MapPin,
  UserCheck,
  Lock,
} from 'lucide-react';
import { Classroom, Student, UserAccount } from '../types';
import { formatVND } from '../utils/vietqr';

interface ClassManagerProps {
  classes: Classroom[];
  students: Student[];
  currentUser?: UserAccount;
  onSaveClass: (classroom: Classroom) => void;
  onDeleteClass: (classId: string) => void;
  onSelectClassForAttendance: (classId: string) => void;
}

const DAYS_OF_WEEK = [
  { val: 1, label: 'Thứ 2' },
  { val: 2, label: 'Thứ 3' },
  { val: 3, label: 'Thứ 4' },
  { val: 4, label: 'Thứ 5' },
  { val: 5, label: 'Thứ 6' },
  { val: 6, label: 'Thứ 7' },
  { val: 0, label: 'Chủ Nhật' },
];

export const ClassManager: React.FC<ClassManagerProps> = ({
  classes,
  students,
  currentUser,
  onSaveClass,
  onDeleteClass,
  onSelectClassForAttendance,
}) => {
  const canViewTuition = currentUser ? currentUser.permissions.canViewTuition : true;
  const canManageClasses = currentUser
    ? currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.permissions.canManageClasses
    : true;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Toán Học');
  const [grade, setGrade] = useState('Lớp 10');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('Phòng 201 (Tầng 2)');
  const [schedule, setSchedule] = useState('Thứ 3, Thứ 6 (18:00 - 19:30)');
  const [scheduleDays, setScheduleDays] = useState<number[]>([2, 5]);
  const [feePerSession, setFeePerSession] = useState<number>(150000);
  const [totalExpectedSessions, setTotalExpectedSessions] = useState<number>(8);
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingClass(null);
    setName('');
    setSubject('Toán Học');
    setGrade('Lớp 10');
    setTeacher('ThS. Nguyễn Hoàng Nam');
    setRoom('Phòng 201 (Tầng 2)');
    setSchedule('Thứ 3, Thứ 6 (18:00 - 19:30)');
    setScheduleDays([2, 5]);
    setFeePerSession(150000);
    setTotalExpectedSessions(8);
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cls: Classroom) => {
    setEditingClass(cls);
    setName(cls.name);
    setSubject(cls.subject);
    setGrade(cls.grade);
    setTeacher(cls.teacher);
    setRoom(cls.room);
    setSchedule(cls.schedule);
    setScheduleDays([...cls.scheduleDays]);
    setFeePerSession(cls.feePerSession);
    setTotalExpectedSessions(cls.totalExpectedSessionsPerMonth);
    setDescription(cls.description || '');
    setIsModalOpen(true);
  };

  const handleToggleDay = (dayVal: number) => {
    if (scheduleDays.includes(dayVal)) {
      setScheduleDays(scheduleDays.filter((d) => d !== dayVal));
    } else {
      setScheduleDays([...scheduleDays, dayVal].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teacher.trim() || !schedule.trim()) {
      alert('Vui lòng điền tên lớp, giáo viên và lịch học!');
      return;
    }

    const clsToSave: Classroom = {
      id: editingClass ? editingClass.id : `CL-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      teacher: teacher.trim(),
      room: room.trim(),
      schedule: schedule.trim(),
      scheduleDays,
      feePerSession: Number(feePerSession) || 150000,
      totalExpectedSessionsPerMonth: Number(totalExpectedSessions) || 8,
      color: editingClass ? editingClass.color : 'indigo',
      description: description.trim(),
    };

    onSaveClass(clsToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Lớp Học & Học Phí Từng Môn</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình thời khoá biểu, học phí từng buổi và chỉ định giáo viên phụ trách.
          </p>
        </div>

        {canManageClasses && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-300 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm lớp học mới</span>
          </button>
        )}
      </div>

      {/* Class cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const classStudents = students.filter(
            (s) => s.status === 'active' && s.classIds.includes(cls.id)
          );

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {cls.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {cls.subject}
                    </span>
                  </div>

                  {canManageClasses && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Sửa lớp"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xoá lớp ${cls.name}?`)) {
                            onDeleteClass(cls.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xoá lớp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2 font-black text-slate-900 text-base leading-snug">
                  {cls.name}
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Giáo viên: <strong className="text-slate-800">{cls.teacher}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-indigo-900">{cls.schedule}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cls.room}</span>
                  </div>

                  {canViewTuition ? (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Học phí:{' '}
                        <strong className="text-slate-900 font-bold">
                          {formatVND(cls.feePerSession)}/buổi
                        </strong>{' '}
                        (~{formatVND(cls.feePerSession * cls.totalExpectedSessionsPerMonth)}/tháng)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Học phí: <em className="text-slate-500 font-medium">Bảo mật (Chỉ Admin & Quản lý)</em>
                      </span>
                    </div>
                  )}

                  {cls.description && (
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      {cls.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{classStudents.length} học sinh</span>
                </div>

                <button
                  onClick={() => onSelectClassForAttendance(cls.id)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Điểm danh lớp
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>{editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Toán 10 - Nâng Cao & Tư Duy (T10A)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Toán Học">Toán Học</option>
                    <option value="Ngữ Văn">Ngữ Văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Vật Lý">Vật Lý</option>
                    <option value="Hoá Học">Hoá Học</option>
                    <option value="Sinh Học">Sinh Học</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Lớp 9">Lớp 9 (Luyện thi vào 10)</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12 (Luyện thi ĐH)</option>
                    <option value="IELTS">IELTS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giáo viên phụ trách
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: ThS. Nguyễn Hoàng Nam"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phòng học
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phòng 201 (Tầng 2)"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lịch học mô tả
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thứ 3, Thứ 6 (18:00 - 19:30)"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Ngày trong tuần */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn các thứ học trong tuần
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = scheduleDays.includes(d.val);
                    return (
                      <button
                        type="button"
                        key={d.val}
                        onClick={() => handleToggleDay(d.val)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {canViewTuition ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Học phí / 1 buổi (VNĐ)
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={feePerSession}
                      onChange={(e) => setFeePerSession(Number(e.target.value))}
                      className="w-full text-xs font-bold text-indigo-700 rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số buổi chuẩn trong tháng
                    </label>
                    <input
                      type="number"
                      value={totalExpectedSessions}
                      onChange={(e) => setTotalExpectedSessions(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Mục học phí và biểu phí được bảo mật bởi Admin & Quản lý.</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả khoá học
                </label>
                <textarea
                  rows={2}
                  placeholder="Mục tiêu đầu ra, nội dung trọng tâm của lớp..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {editingClass ? 'Cập nhật lớp' : 'Tạo lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
