import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserAccount, CenterSettings } from '../types';

interface LoginViewProps {
  users: UserAccount[];
  settings: CenterSettings;
  onLogin: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, settings, onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setErrorMsg('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    const foundUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '') ||
        u.email.toLowerCase() === cleanId
    );

    if (!foundUser) {
      setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác.');
      return;
    }

    if (foundUser.status === 'blocked') {
      setErrorMsg('Tài khoản này hiện đang bị khoá. Vui lòng liên hệ Admin trung tâm.');
      return;
    }

    const correctPassword = foundUser.password || 'admin';
    if (cleanPass !== correctPassword) {
      setErrorMsg('Mật khẩu không chính xác. Vui lòng thử lại!');
      return;
    }

    // Success
    onLogin(foundUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Background ambient lights */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-500/25 mb-1 ring-4 ring-white/10">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            {settings.centerName}
          </h1>
          <p className="text-xs text-indigo-200/80 font-medium">
            Hệ thống Quản lý Điểm danh, Học bù & Học phí VietQR
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đăng nhập phân quyền: <strong>Admin</strong> & <strong>Giáo viên</strong></span>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-900 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Đăng nhập tài khoản</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sử dụng tài khoản do Admin trung tâm cấp để truy cập
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {/* Username / Phone */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">
                Tên đăng nhập / Số điện thoại / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: admin hoặc tên đăng nhập giáo viên"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Support */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>

              <span className="text-slate-400 italic">
                Quên mật khẩu? Liên hệ Admin
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập hệ thống</span>
            </button>
          </form>

          {/* Admin initial note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              Tài khoản quản trị mặc định: <strong>admin</strong> / mật khẩu: <strong>admin</strong>.
              Sau khi đăng nhập, Admin có thể tạo tài khoản cho các giáo viên tại mục <strong>"Tài khoản"</strong>.
            </div>
          </div>
        </div>

        {/* Security Summary Badge */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Điểm danh & BTVN
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Xếp lịch học bù
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> VietQR Napas247
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} {settings.centerName} · {settings.address}
          </p>
        </div>
      </div>
    </div>
  );
};
