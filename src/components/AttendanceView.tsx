import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserPlus,
  BookOpen,
  Calendar,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  Classroom,
  Student,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  MakeupRequest,
} from '../types';
import { formatDateVN } from '../utils/vietqr';

interface AttendanceViewProps {
  classes: Classroom[];
  students: Student[];
  attendanceSessions: AttendanceSession[];
  makeupRequests: MakeupRequest[];
  onSaveAttendance: (session: AttendanceSession, updatedMakeupIds: string[]) => void;
  onRequestMakeup: (studentId: string, originalClassId: string, missedDate: string) => void;
  initialClassId?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  classes,
  students,
  attendanceSessions,
  makeupRequests,
  onSaveAttendance,
  onRequestMakeup,
  initialClassId,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (classes.length > 0 ? classes[0].id : '')
  );
  
  // Ngày điểm danh (mặc định hôm nay)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [lessonTitle, setLessonTitle] = useState('');
  const [homework, setHomework] = useState('');
  const [teacherNote, setTeacherNote] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeTabMode, setActiveTabMode] = useState<'mark' | 'history'>('mark');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Modal to add external student as makeup on the fly
  const [isAddMakeupModalOpen, setIsAddMakeupModalOpen] = useState(false);
  const [selectedAdHocStudentId, setSelectedAdHocStudentId] = useState('');

  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Load or initialize attendance records whenever class or date changes
  useEffect(() => {
    if (!selectedClassId) return;

    // Check if a session already exists for this class & date
    const existing = attendanceSessions.find(
      (s) => s.classId === selectedClassId && s.date === selectedDate
    );

    if (existing) {
      setLessonTitle(existing.lessonTitle || '');
      setHomework(existing.homework || '');
      setTeacherNote(existing.teacherNote || '');
      setRecords([...existing.records]);
    } else {
      // Create fresh records for all active students in class
      setLessonTitle('');
      setHomework('');
      setTeacherNote('');

      const regularStudents = students.filter(
        (s) => s.status === 'active' && s.classIds.includes(selectedClassId)
      );

      const initialList: AttendanceRecord[] = regularStudents.map((s) => ({
        studentId: s.id,
        status: 'present',
        note: '',
      }));

      // Automatically search for students scheduled for makeup in THIS class on THIS date
      const scheduledMakeups = makeupRequests.filter(
        (m) =>
          m.makeupClassId === selectedClassId &&
          m.targetDate === selectedDate &&
          (m.status === 'scheduled' || m.status === 'pending')
      );

      scheduledMakeups.forEach((mk) => {
        // avoid duplicate if already in list
        if (!initialList.some((r) => r.studentId === mk.studentId)) {
          initialList.push({
            studentId: mk.studentId,
            status: 'present',
            isMakeup: true,
            makeupRequestId: mk.id,
            note: 'Học sinh học bù theo lịch đăng ký',
          });
        }
      });

      setRecords(initialList);
    }
  }, [selectedClassId, selectedDate, attendanceSessions, makeupRequests, students]);

  // Update status for a specific record
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  // Update note for a specific record
  const handleNoteChange = (studentId: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
  };

  // Quick mark all present
  const handleMarkAllPresent = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'present' })));
  };

  // Add ad-hoc makeup student
  const handleAddAdHocMakeupStudent = () => {
    if (!selectedAdHocStudentId) return;
    if (records.some((r) => r.studentId === selectedAdHocStudentId)) {
      alert('Học sinh này đã có trong danh sách điểm danh buổi này!');
      return;
    }

    setRecords((prev) => [
      ...prev,
      {
        studentId: selectedAdHocStudentId,
        status: 'present',
        isMakeup: true,
        note: 'Học bù thêm vào buổi này',
      },
    ]);
    setSelectedAdHocStudentId('');
    setIsAddMakeupModalOpen(false);
  };

  // Save attendance
  const handleSave = () => {
    if (!selectedClassId) return;

    const sessionId = `ATT-${selectedDate.replace(/-/g, '')}-${selectedClassId}`;
    const newSession: AttendanceSession = {
      id: sessionId,
      classId: selectedClassId,
      date: selectedDate,
      lessonTitle: lessonTitle || `Buổi học ngày ${formatDateVN(selectedDate)}`,
      homework,
      teacherNote,
      records,
      createdAt: new Date().toISOString(),
    };

    // Find any makeup requests fulfilled by this session
    const completedMakeupIds: string[] = [];
    records.forEach((r) => {
      if (r.isMakeup && r.makeupRequestId && (r.status === 'present' || r.status === 'late')) {
        completedMakeupIds.push(r.makeupRequestId);
      }
    });

    onSaveAttendance(newSession, completedMakeupIds);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Stats for this session
  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const excusedCount = records.filter((r) => r.status === 'absent_excused').length;
  const unexcusedCount = records.filter((r) => r.status === 'absent_unexcused').length;
  const makeupCount = records.filter((r) => r.isMakeup).length;

  // Past sessions for this class
  const classHistorySessions = attendanceSessions.filter(
    (s) => s.classId === selectedClassId
  ).sort((a, b) => b.date.localeCompare(a.date));

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Chưa có lớp học nào để điểm danh
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Vui lòng tạo lớp học và thêm học sinh vào lớp trước khi thực hiện điểm danh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              <span>Điểm Danh & Ghi Nhận Buổi Học</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ điểm danh học sinh chính thức, học sinh học bù từ lớp khác và ghi nhận bài tập về nhà.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabMode('mark')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTabMode === 'mark'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Điểm danh hôm nay
            </button>
            <button
              onClick={() => setActiveTabMode('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTabMode === 'history'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử các buổi ({classHistorySessions.length})</span>
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Chọn Lớp học
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-sm font-semibold rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.teacher}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ngày điểm danh
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-sm font-semibold rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="w-full text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl p-2.5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Chọn ngày hôm nay ({formatDateVN(todayStr)})</span>
            </button>
          </div>
        </div>

        {/* Selected Class info badge */}
        {currentClass && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{currentClass.name}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">Giáo viên: {currentClass.teacher}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{currentClass.room}</span>
            </div>
            <div className="text-slate-700 font-medium">
              Lịch: <span className="font-semibold text-indigo-700">{currentClass.schedule}</span>
            </div>
          </div>
        )}
      </div>

      {activeTabMode === 'mark' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Attendance List (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Actions & Session Stats */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-800">Sĩ số buổi này: {total}</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700 font-semibold">Có mặt: {presentCount}</span>
                <span className="text-amber-700 font-semibold">Đi muộn: {lateCount}</span>
                <span className="text-rose-700 font-semibold">Vắng: {excusedCount + unexcusedCount}</span>
                {makeupCount > 0 && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                    Học bù: {makeupCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                >
                  Tất cả có mặt
                </button>
                <button
                  onClick={() => setIsAddMakeupModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Thêm học bù</span>
                </button>
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Lớp chưa có học sinh nào. Hãy vào mục "Học sinh" để thêm học sinh vào lớp này.
                  </div>
                ) : (
                  records.map((rec, idx) => {
                    const student = students.find((s) => s.id === rec.studentId);
                    if (!student) return null;

                    const isMakeup = rec.isMakeup;

                    return (
                      <div
                        key={rec.studentId}
                        className={`p-4 transition-colors ${
                          isMakeup ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Student Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {student.fullName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500">
                                  ({student.id})
                                </span>
                                {isMakeup && (
                                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                                    Học bù
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>PH: {student.parentName}</span>
                                <span>·</span>
                                <span className="font-mono">{student.parentPhone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Attendance Status Selector Buttons */}
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.studentId, 'present')}
                              className={`h-10 sm:h-auto px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-xl sm:rounded-lg transition-all flex items-center justify-center gap-1 ${
                                rec.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>Có mặt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.studentId, 'late')}
                              className={`h-10 sm:h-auto px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-xl sm:rounded-lg transition-all flex items-center justify-center gap-1 ${
                                rec.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                              }`}
                            >
                              <Clock className="w-4 h-4 shrink-0" />
                              <span>Đi muộn</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.studentId, 'absent_excused')}
                              className={`h-10 sm:h-auto px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-xl sm:rounded-lg transition-all flex items-center justify-center gap-1 ${
                                rec.status === 'absent_excused'
                                  ? 'bg-rose-500 text-white shadow-xs font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                              }`}
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>Vắng phép</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.studentId, 'absent_unexcused')}
                              className={`h-10 sm:h-auto px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-xl sm:rounded-lg transition-all flex items-center justify-center gap-1 ${
                                rec.status === 'absent_unexcused'
                                  ? 'bg-red-700 text-white shadow-xs font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                              }`}
                            >
                              <XCircle className="w-4 h-4 shrink-0" />
                              <span>K.phép</span>
                            </button>
                          </div>
                        </div>

                        {/* Extra note or Quick Makeup Button */}
                        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <input
                            type="text"
                            placeholder="Ghi chú cá nhân (ví dụ: làm bài kiểm tra 9đ, quên sách...)"
                            value={rec.note || ''}
                            onChange={(e) => handleNoteChange(rec.studentId, e.target.value)}
                            className="w-full sm:max-w-md px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />

                          {rec.status === 'absent_excused' && !isMakeup && (
                            <button
                              type="button"
                              onClick={() =>
                                onRequestMakeup(rec.studentId, selectedClassId, selectedDate)
                              }
                              className="text-indigo-700 hover:text-indigo-900 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Đăng ký lịch học bù</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Lesson Notes & Save Button (1/3) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Nội dung buổi dạy</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chủ đề bài học hôm nay
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đại số 10 - Hệ bất phương trình bậc nhất hai ẩn"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bài tập về nhà
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Làm bài tập 1, 2, 4 trang 52 sách bài tập. Chuẩn bị bài mới."
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhận xét chung của giáo viên
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhận xét tình hình học tập chung của lớp..."
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã lưu điểm danh & cập nhật học bù thành công!</span>
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Lưu buổi điểm danh</span>
              </button>
            </div>
          </div>

          {/* Mobile Sticky Quick Save Bar (floating above bottom navigation) */}
          <div className="md:hidden fixed bottom-20 left-3 right-3 z-30 bg-slate-900/95 text-white backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-fade-in no-print">
            <div className="text-xs">
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{presentCount}/{total} có mặt</span>
                {makeupCount > 0 && (
                  <span className="text-[10px] text-indigo-300 font-bold">
                    (+{makeupCount} bù)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                {currentClass?.name}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-transform"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg ? '✓ Đã lưu!' : 'Lưu điểm danh'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* History of Sessions Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900">
              Lịch sử các buổi điểm danh của lớp: {currentClass?.name}
            </h2>
            <span className="text-xs text-slate-500">
              Tổng cộng {classHistorySessions.length} buổi
            </span>
          </div>

          <div className="space-y-3">
            {classHistorySessions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Chưa có buổi điểm danh nào được lưu cho lớp này.
              </div>
            ) : (
              classHistorySessions.map((session) => {
                const pCount = session.records.filter((r) => r.status === 'present').length;
                const aCount = session.records.filter((r) => r.status.startsWith('absent')).length;

                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatDateVN(session.date)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-indigo-700">
                          {session.lessonTitle}
                        </span>
                      </div>
                      {session.homework && (
                        <div className="text-slate-500 mt-1">
                          <span className="font-semibold text-slate-600">BTVN:</span>{' '}
                          {session.homework}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-emerald-700 font-semibold">
                          {pCount} có mặt
                        </span>
                        {aCount > 0 && (
                          <span className="text-rose-600 font-semibold ml-2">
                            {aCount} vắng
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedDate(session.date);
                          setActiveTabMode('mark');
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                      >
                        Xem & Chỉnh sửa
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Thêm học sinh học bù từ lớp khác */}
      {isAddMakeupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Thêm học sinh học bù</span>
              </h3>
              <button
                onClick={() => setIsAddMakeupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Chọn học sinh từ danh sách toàn trung tâm để tham gia học bù vào buổi{' '}
              <span className="font-bold text-slate-900">{formatDateVN(selectedDate)}</span>{' '}
              của lớp <span className="font-bold text-indigo-700">{currentClass?.name}</span>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn học sinh
              </label>
              <select
                value={selectedAdHocStudentId}
                onChange={(e) => setSelectedAdHocStudentId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Chọn học sinh --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.id}) - PH: {s.parentPhone}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddMakeupModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={!selectedAdHocStudentId}
                onClick={handleAddAdHocMakeupStudent}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs"
              >
                Thêm vào buổi này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
