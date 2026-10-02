import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  Clock3,
  Receipt,
  Grid2X2,
  BookOpen,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pendingMakeupCount: number;
  unpaidInvoiceCount: number;
  onOpenMoreMenu: () => void;
  isMoreMenuOpen: boolean;
  canViewTuition: boolean; // RBAC: Chỉ admin và quản lý mới xem được học phí
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingMakeupCount,
  unpaidInvoiceCount,
  onOpenMoreMenu,
  isMoreMenuOpen,
  canViewTuition,
}) => {
  const isMoreActive =
    isMoreMenuOpen ||
    activeTab === 'students' ||
    activeTab === 'settings' ||
    activeTab === 'users' ||
    (!canViewTuition && activeTab === 'classes');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe no-print">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {/* 1. Tổng quan */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 transition-all relative ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Tổng quan</span>
        </button>

        {/* 2. Học bù & Đổi ca */}
        <button
          type="button"
          onClick={() => setActiveTab('makeup')}
          className={`flex flex-col items-center justify-center py-1 transition-all relative ${
            activeTab === 'makeup'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Clock3 className="w-5 h-5" />
            {pendingMakeupCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {pendingMakeupCount > 9 ? '9+' : pendingMakeupCount}
              </span>
            )}
            {activeTab === 'makeup' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Học bù</span>
        </button>

        {/* 3. Center Raised FAB: Điểm danh */}
        <div className="flex flex-col items-center justify-center relative -top-3">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`w-13 h-13 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-90 ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-indigo-300 ring-4 ring-indigo-100'
                : 'bg-gradient-to-tr from-slate-900 to-indigo-900 text-white shadow-slate-300'
            }`}
            title="Điểm danh ngay"
          >
            <CalendarCheck2 className="w-6 h-6" />
          </button>
          <span
            className={`text-[10px] mt-0.5 tracking-tight font-bold ${
              activeTab === 'attendance' ? 'text-indigo-600' : 'text-slate-600'
            }`}
          >
            Điểm danh
          </span>
        </div>

        {/* 4. Slot 4: HỌC PHÍ (Cho Admin/Quản lý) HOẶC LỚP HỌC (Cho Giáo viên - Ẩn học phí) */}
        {canViewTuition ? (
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'invoices'
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Receipt className="w-5 h-5" />
              {unpaidInvoiceCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {unpaidInvoiceCount > 9 ? '9+' : unpaidInvoiceCount}
                </span>
              )}
              {activeTab === 'invoices' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Học phí</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'classes'
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <BookOpen className="w-5 h-5" />
              {activeTab === 'classes' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Lớp học</span>
          </button>
        )}

        {/* 5. Menu Mở rộng */}
        <button
          type="button"
          onClick={onOpenMoreMenu}
          className={`flex flex-col items-center justify-center py-1 transition-all relative ${
            isMoreActive
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Grid2X2 className="w-5 h-5" />
            {isMoreActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
