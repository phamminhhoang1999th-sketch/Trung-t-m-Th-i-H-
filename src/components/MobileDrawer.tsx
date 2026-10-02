import React from 'react';
import {
  Users,
  BookOpen,
  Settings,
  PhoneCall,
  X,
  PlusCircle,
  Sparkles,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  Receipt,
  CalendarCheck2,
  LogOut,
} from 'lucide-react';
import { NavTab } from './Navbar';
import { CenterSettings, UserAccount } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  settings: CenterSettings;
  studentsCount: number;
  classesCount: number;
  currentUser: UserAccount;
  onOpenNewMakeupModal: () => void;
  onQuickGenerateInvoices: () => void;
  onLogout?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  settings,
  studentsCount,
  classesCount,
  currentUser,
  onOpenNewMakeupModal,
  onQuickGenerateInvoices,
  onLogout,
}) => {
  if (!isOpen) return null;

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-up Container */}
      <div className="relative z-10 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-5 pb-safe space-y-5 animate-slide-up">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />

        {/* Drawer Header with Current User Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 leading-tight">
                {currentUser.fullName}
              </div>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-indigo-700 uppercase tracking-wide">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'manager' ? 'Quản lý' : 'Giáo viên'}
                </span>
                <span>·</span>
                <span>@{currentUser.username}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Extended Management Sections */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Danh mục tính năng
          </div>

          {/* Học sinh */}
          <button
            type="button"
            onClick={() => handleSelectTab('students')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              activeTab === 'students'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Danh sách Học sinh</div>
                <div className="text-[11px] text-slate-500">
                  {studentsCount} học sinh theo học
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Lớp học */}
          <button
            type="button"
            onClick={() => handleSelectTab('classes')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              activeTab === 'classes'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Quản lý Lớp học</div>
                <div className="text-[11px] text-slate-500">
                  {classesCount} lớp đang hoạt động
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Học phí (CHỈ HIỆN VỚI ADMIN VÀ QUẢN LÝ) */}
          {currentUser.permissions.canViewTuition && (
            <button
              type="button"
              onClick={() => handleSelectTab('invoices')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                activeTab === 'invoices'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                  : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Học phí & Hoá đơn VietQR</div>
                  <div className="text-[11px] text-slate-500">
                    Chỉ Admin & Quản lý
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Phân quyền tài khoản (CHỈ ADMIN) */}
          {(currentUser.role === 'admin' || currentUser.permissions.canManageUsers) && (
            <button
              type="button"
              onClick={() => handleSelectTab('users')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-50 border-purple-200 text-purple-900 font-bold'
                  : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Tài khoản & Phân quyền GV</div>
                  <div className="text-[11px] text-slate-500">
                    Cấp tài khoản & phân quyền
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Cấu hình trung tâm */}
          <button
            type="button"
            onClick={() => handleSelectTab('settings')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">
                  {currentUser.role === 'teacher' ? 'Cấu hình Trung tâm' : 'Cấu hình & Ngân hàng VietQR'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentUser.role === 'teacher'
                    ? 'Thông tin trung tâm & Hệ thống'
                    : `${settings.bankName.split('(')[0]} · ${settings.bankAccountNo}`}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Thao tác nhanh
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewMakeupModal();
              }}
              className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-2xl text-left transition-colors flex flex-col justify-between"
            >
              <PlusCircle className="w-4 h-4 text-amber-700 mb-2" />
              <div>
                <div className="text-xs font-bold text-amber-950">Đăng ký học bù</div>
                <div className="text-[10px] text-amber-800 mt-0.5">Xếp ca nghỉ</div>
              </div>
            </button>

            {currentUser.permissions.canViewTuition ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onQuickGenerateInvoices();
                }}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-2xl text-left transition-colors flex flex-col justify-between"
              >
                <Sparkles className="w-4 h-4 text-indigo-700 mb-2" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">Tính học phí</div>
                  <div className="text-[10px] text-indigo-800 mt-0.5">Xuất VietQR</div>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveTab('attendance');
                }}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-2xl text-left transition-colors flex flex-col justify-between"
              >
                <CalendarCheck2 className="w-4 h-4 text-indigo-700 mb-2" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">Điểm danh ngay</div>
                  <div className="text-[10px] text-indigo-800 mt-0.5">Ghi nhận buổi dạy</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Hotline Contact Bar */}
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Hotline Trung tâm</div>
              <div className="text-[11px] text-slate-300 font-mono">{settings.hotline}</div>
            </div>
          </div>
          <a
            href={`tel:${settings.hotline.replace(/[^0-9]/g, '')}`}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl transition-colors shadow-xs"
          >
            Gọi ngay
          </a>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản ({currentUser.username})</span>
          </button>
        )}
      </div>
    </div>
  );
};
