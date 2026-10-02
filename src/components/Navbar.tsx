import React, { useState } from 'react';
import {
  GraduationCap,
  CalendarCheck2,
  Clock3,
  Receipt,
  Users,
  BookOpen,
  Settings,
  LayoutDashboard,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Lock,
} from 'lucide-react';
import { CenterSettings, UserAccount } from '../types';

export type NavTab =
  | 'dashboard'
  | 'attendance'
  | 'makeup'
  | 'invoices'
  | 'students'
  | 'classes'
  | 'settings'
  | 'users';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  settings: CenterSettings;
  pendingMakeupCount: number;
  unpaidInvoiceCount: number;
  currentUser: UserAccount;
  usersList: UserAccount[];
  onSwitchUser: (user: UserAccount) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  pendingMakeupCount,
  unpaidInvoiceCount,
  currentUser,
  usersList,
  onSwitchUser,
}) => {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Dynamic navigation items based on role & permissions
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'attendance', label: 'Điểm danh', icon: <CalendarCheck2 className="w-4 h-4" /> },
    {
      id: 'makeup',
      label: 'Học bù & Đổi ca',
      icon: <Clock3 className="w-4 h-4" />,
      badge: pendingMakeupCount,
    },
  ];

  // CHỈ ADMIN VÀ QUẢN LÝ MỚI XEM ĐƯỢC HỌC PHÍ
  if (currentUser.permissions.canViewTuition) {
    navItems.push({
      id: 'invoices',
      label: 'Học phí & VietQR',
      icon: <Receipt className="w-4 h-4" />,
      badge: unpaidInvoiceCount,
    });
  }

  navItems.push(
    { id: 'students', label: 'Học sinh', icon: <Users className="w-4 h-4" /> },
    { id: 'classes', label: 'Lớp học', icon: <BookOpen className="w-4 h-4" /> }
  );

  // Admin có thêm tab Tài khoản & Phân quyền
  if (currentUser.role === 'admin' || currentUser.permissions.canManageUsers) {
    navItems.push({
      id: 'users',
      label: 'Tài khoản',
      icon: <ShieldCheck className="w-4 h-4" />,
    });
  }

  navItems.push({ id: 'settings', label: 'Cấu hình', icon: <Settings className="w-4 h-4" /> });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Desktop Top Micro Bar with User Quick Switcher */}
      <div className="hidden md:flex bg-slate-900 text-slate-300 text-xs px-4 py-1.5 justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white tracking-wide">
            {settings.centerName}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 truncate max-w-md">
            {settings.address}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <a
            href={`tel:${settings.hotline.replace(/[^0-9]/g, '')}`}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">{settings.hotline}</span>
          </a>
          <span className="text-slate-500">·</span>

          {/* Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-0.5 rounded-lg border border-slate-700 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-[11px]">{currentUser.fullName}</span>
              <span className="text-[10px] text-indigo-300 font-medium uppercase">
                ({currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'manager' ? 'Quản lý' : 'Giáo viên'})
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isAccountDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Chuyển nhanh tài khoản để kiểm tra
                </div>
                {usersList.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setIsAccountDropdownOpen(false);
                      // If teacher was on invoices tab, switch to dashboard
                      if (u.role === 'teacher' && activeTab === 'invoices') {
                        setActiveTab('dashboard');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                      u.id === currentUser.id ? 'bg-indigo-50/70 font-bold text-indigo-700' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{u.fullName}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>@{u.username}</span>
                        <span>·</span>
                        <span className="capitalize">{u.role}</span>
                      </div>
                    </div>
                    {u.permissions.canViewTuition ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Xem học phí
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Ẩn học phí
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>GIÁO DỤC THÁI HÀ</span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded">
                  EduManager
                </span>
              </div>
              <div className="hidden sm:block text-xs text-slate-500 font-medium truncate max-w-xs">
                Điểm danh · Học bù · Hoá đơn VietQR
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all relative ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action button */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('attendance')}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-300"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Điểm danh ngay</span>
            </button>
          </div>

          {/* Mobile Right Bar: Role badge + Attendance button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[90px]">{currentUser.fullName.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform"
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>Điểm danh</span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown for account switcher */}
        {isAccountDropdownOpen && (
          <div className="md:hidden p-3 bg-slate-50 border-t border-slate-200 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Đổi tài khoản đăng nhập:
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u);
                    setIsAccountDropdownOpen(false);
                    if (u.role === 'teacher' && activeTab === 'invoices') {
                      setActiveTab('dashboard');
                    }
                  }}
                  className={`p-2 rounded-xl text-left text-xs flex items-center justify-between border ${
                    u.id === currentUser.id
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                      : 'bg-white text-slate-800 border-slate-200'
                  }`}
                >
                  <div>
                    <div>{u.fullName}</div>
                    <div className="text-[10px] opacity-80">@{u.username} · {u.role}</div>
                  </div>
                  {u.permissions.canViewTuition ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.id === currentUser.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                      Xem học phí
                    </span>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.id === currentUser.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      Ẩn học phí
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
