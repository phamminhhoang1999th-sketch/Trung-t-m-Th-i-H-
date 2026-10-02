import React, { useState, useEffect } from 'react';
import {
  Classroom,
  Student,
  AttendanceSession,
  MakeupRequest,
  Invoice,
  CenterSettings,
  MakeupStatus,
  UserAccount,
} from './types';
import { Storage } from './utils/storage';
import { generateMonthlyInvoices } from './utils/billing';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AttendanceView } from './components/AttendanceView';
import { MakeupView } from './components/MakeupView';
import { InvoiceView } from './components/InvoiceView';
import { InvoiceModal } from './components/InvoiceModal';
import { StudentManager } from './components/StudentManager';
import { ClassManager } from './components/ClassManager';
import { SettingsView } from './components/SettingsView';
import { UserManager } from './components/UserManager';
import { BottomNav } from './components/BottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { LoginView } from './components/LoginView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentMonth, setCurrentMonth] = useState<string>('2026-10');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Core Data States
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSession[]>([]);
  const [makeupRequests, setMakeupRequests] = useState<MakeupRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<CenterSettings>(Storage.getSettings());

  // User Accounts & Authentication States (RBAC)
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => Storage.getCurrentUser());

  // Interactive selection states
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<string>('');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

  // Makeup modal prefill state
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [makeupPrefill, setMakeupPrefill] = useState<{
    studentId?: string;
    originalClassId?: string;
    missedDate?: string;
  } | null>(null);

  // Load from Storage on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setClasses(Storage.getClasses());
    setStudents(Storage.getStudents());
    setAttendance(Storage.getAttendance());
    setMakeupRequests(Storage.getMakeupRequests());
    setInvoices(Storage.getInvoices());
    setSettings(Storage.getSettings());
    const loadedUsers = Storage.getUsers();
    setUsers(loadedUsers);
    const activeCurrent = Storage.getCurrentUser();
    if (activeCurrent) {
      setCurrentUser(activeCurrent);
    }
  };

  // --- Handlers ---

  const handleLogout = () => {
    setCurrentUser(null);
    Storage.setCurrentUser(null);
    setIsMoreMenuOpen(false);
  };

  // Quản lý tài khoản & Phân quyền (RBAC)
  const handleSaveUser = (user: UserAccount) => {
    const exists = users.some((u) => u.id === user.id);
    let updated: UserAccount[];
    if (exists) {
      updated = users.map((u) => (u.id === user.id ? user : u));
    } else {
      updated = [...users, user];
    }
    setUsers(updated);
    Storage.saveUsers(updated);

    // If updated user is current user, update current user state
    if (currentUser?.id === user.id) {
      setCurrentUser(user);
      Storage.setCurrentUser(user);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'USR-ADMIN' || userId === currentUser?.id) {
      alert('Không thể xoá tài khoản Admin đang quản trị hệ thống!');
      return;
    }
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    Storage.saveUsers(updated);
  };

  const handleSwitchUser = (user: UserAccount) => {
    setCurrentUser(user);
    Storage.setCurrentUser(user);

    // If switched to teacher who cannot view tuition and currently on invoice tab, switch to dashboard
    if (!user.permissions.canViewTuition && activeTab === 'invoices') {
      setActiveTab('dashboard');
    }
  };

  // Điểm danh
  const handleSaveAttendance = (
    session: AttendanceSession,
    completedMakeupIds: string[]
  ) => {
    // 1. Update attendance sessions
    const updatedSessions = [...attendance];
    const existingIndex = updatedSessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      updatedSessions[existingIndex] = session;
    } else {
      updatedSessions.unshift(session);
    }
    setAttendance(updatedSessions);
    Storage.saveAttendance(updatedSessions);

    // 2. Automatically complete any makeup requests fulfilled by this attendance session
    if (completedMakeupIds.length > 0) {
      const updatedMakeups = makeupRequests.map((req) => {
        if (completedMakeupIds.includes(req.id)) {
          return {
            ...req,
            status: 'completed' as MakeupStatus,
            completedAt: new Date().toISOString(),
          };
        }
        return req;
      });
      setMakeupRequests(updatedMakeups);
      Storage.saveMakeupRequests(updatedMakeups);
    }
  };

  const handleRequestMakeupFromAttendance = (
    studentId: string,
    originalClassId: string,
    missedDate: string
  ) => {
    setMakeupPrefill({ studentId, originalClassId, missedDate });
    setIsMakeupModalOpen(true);
    setActiveTab('makeup');
  };

  // Học bù
  const handleSaveMakeupRequest = (request: MakeupRequest) => {
    const updated = [request, ...makeupRequests.filter((r) => r.id !== request.id)];
    setMakeupRequests(updated);
    Storage.saveMakeupRequests(updated);
  };

  const handleUpdateMakeupStatus = (requestId: string, status: MakeupStatus) => {
    const updated = makeupRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : r.completedAt,
          }
        : r
    );
    setMakeupRequests(updated);
    Storage.saveMakeupRequests(updated);
  };

  // Học phí & Hoá đơn
  const handleGenerateMonthlyInvoices = (month: string) => {
    const { newInvoices } = generateMonthlyInvoices({
      month,
      classes,
      students,
      sessions: attendance,
      existingInvoices: invoices,
      settings,
    });
    setInvoices(newInvoices);
    Storage.saveInvoices(newInvoices);
  };

  const handleMarkAsPaid = (
    invoiceId: string,
    method: 'vietqr' | 'cash' | 'transfer'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = invoices.map((inv) =>
      inv.id === invoiceId
        ? {
            ...inv,
            status: 'paid' as const,
            paidAmount: inv.totalAmount,
            paymentDate: today,
            paymentMethod: method,
          }
        : inv
    );
    setInvoices(updated);
    Storage.saveInvoices(updated);

    if (selectedInvoiceForModal?.id === invoiceId) {
      setSelectedInvoiceForModal({
        ...selectedInvoiceForModal,
        status: 'paid',
        paidAmount: selectedInvoiceForModal.totalAmount,
        paymentDate: today,
        paymentMethod: method,
      });
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const updated = invoices.filter((i) => i.id !== invoiceId);
    setInvoices(updated);
    Storage.saveInvoices(updated);
  };

  // Học sinh
  const handleSaveStudent = (student: Student) => {
    const exists = students.some((s) => s.id === student.id);
    let updated: Student[];
    if (exists) {
      updated = students.map((s) => (s.id === student.id ? student : s));
    } else {
      updated = [student, ...students];
    }
    setStudents(updated);
    Storage.saveStudents(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    Storage.saveStudents(updated);
  };

  // Lớp học
  const handleSaveClass = (classroom: Classroom) => {
    const exists = classes.some((c) => c.id === classroom.id);
    let updated: Classroom[];
    if (exists) {
      updated = classes.map((c) => (c.id === classroom.id ? classroom : c));
    } else {
      updated = [...classes, classroom];
    }
    setClasses(updated);
    Storage.saveClasses(updated);
  };

  const handleDeleteClass = (classId: string) => {
    const updated = classes.filter((c) => c.id !== classId);
    setClasses(updated);
    Storage.saveClasses(updated);
  };

  // Cấu hình
  const handleSaveSettings = (newSettings: CenterSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
  };

  // Quick navigation helpers
  const handleSelectClassForAttendance = (classId: string) => {
    setSelectedClassForAttendance(classId);
    setActiveTab('attendance');
  };

  // Counts for badges
  const pendingMakeupCount = makeupRequests.filter((m) => m.status === 'pending').length;
  const unpaidInvoiceCount = invoices.filter(
    (i) => i.month === currentMonth && i.status !== 'paid'
  ).length;

  // Selected student and classroom for open invoice modal
  const invoiceStudent = selectedInvoiceForModal
    ? students.find((s) => s.id === selectedInvoiceForModal.studentId)
    : undefined;
  const invoiceClass = selectedInvoiceForModal
    ? classes.find((c) => c.id === selectedInvoiceForModal.classId)
    : undefined;

  // Nếu chưa đăng nhập: Hiển thị màn hình Đăng nhập riêng biệt cho Admin & Giáo viên
  if (!currentUser) {
    return (
      <LoginView
        users={users.length > 0 ? users : Storage.getUsers()}
        settings={settings}
        onLogin={(user) => {
          setCurrentUser(user);
          Storage.setCurrentUser(user);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        pendingMakeupCount={pendingMakeupCount}
        unpaidInvoiceCount={unpaidInvoiceCount}
        currentUser={currentUser}
        usersList={users}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-28 md:pb-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            classes={classes}
            students={students}
            attendance={attendance}
            makeupRequests={makeupRequests}
            invoices={invoices}
            setActiveTab={setActiveTab}
            onSelectClassForAttendance={handleSelectClassForAttendance}
            onOpenInvoiceModal={setSelectedInvoiceForModal}
            onOpenNewMakeupModal={() => {
              setMakeupPrefill(null);
              setIsMakeupModalOpen(true);
              setActiveTab('makeup');
            }}
            currentMonth={currentMonth}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            classes={classes}
            students={students}
            attendanceSessions={attendance}
            makeupRequests={makeupRequests}
            onSaveAttendance={handleSaveAttendance}
            onRequestMakeup={handleRequestMakeupFromAttendance}
            initialClassId={selectedClassForAttendance}
          />
        )}

        {activeTab === 'makeup' && (
          <MakeupView
            classes={classes}
            students={students}
            makeupRequests={makeupRequests}
            onSaveMakeupRequest={handleSaveMakeupRequest}
            onUpdateStatus={handleUpdateMakeupStatus}
            isCreateModalOpen={isMakeupModalOpen}
            setIsCreateModalOpen={setIsMakeupModalOpen}
            prefillData={makeupPrefill}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceView
            invoices={invoices}
            students={students}
            classes={classes}
            settings={settings}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onGenerateMonthlyInvoices={handleGenerateMonthlyInvoices}
            onOpenInvoiceModal={setSelectedInvoiceForModal}
            onMarkAsPaid={handleMarkAsPaid}
            onDeleteInvoice={handleDeleteInvoice}
            currentUser={currentUser}
            onGoToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            students={students}
            classes={classes}
            attendance={attendance}
            invoices={invoices}
            makeupRequests={makeupRequests}
            currentUser={currentUser}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenNewMakeupForStudent={(studentId) => {
              setMakeupPrefill({ studentId });
              setIsMakeupModalOpen(true);
              setActiveTab('makeup');
            }}
          />
        )}

        {activeTab === 'classes' && (
          <ClassManager
            classes={classes}
            students={students}
            currentUser={currentUser}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
            onSelectClassForAttendance={handleSelectClassForAttendance}
          />
        )}

        {activeTab === 'users' && (
          <UserManager
            users={users}
            classes={classes}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onSwitchUser={handleSwitchUser}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
            onRefreshData={loadAllData}
          />
        )}
      </main>

      {/* Invoice Details & VietQR Modal */}
      {selectedInvoiceForModal && (
        <InvoiceModal
          invoice={selectedInvoiceForModal}
          student={invoiceStudent}
          classroom={invoiceClass}
          settings={settings}
          onClose={() => setSelectedInvoiceForModal(null)}
          onMarkAsPaid={handleMarkAsPaid}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Fixed for phones) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMoreMenuOpen(false);
        }}
        pendingMakeupCount={pendingMakeupCount}
        unpaidInvoiceCount={unpaidInvoiceCount}
        onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
        isMoreMenuOpen={isMoreMenuOpen}
        canViewTuition={currentUser.permissions.canViewTuition}
      />

      {/* Mobile Slide-Up Drawer Sheet */}
      <MobileDrawer
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        studentsCount={students.length}
        classesCount={classes.length}
        currentUser={currentUser}
        onOpenNewMakeupModal={() => {
          setMakeupPrefill(null);
          setIsMakeupModalOpen(true);
          setActiveTab('makeup');
        }}
        onQuickGenerateInvoices={() => {
          handleGenerateMonthlyInvoices(currentMonth);
          setActiveTab('invoices');
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
