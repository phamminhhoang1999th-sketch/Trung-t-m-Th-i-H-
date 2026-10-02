import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  BookOpen,
  DollarSign,
  GraduationCap,
  CreditCard,
} from 'lucide-react';
import { UserAccount, UserRole, Classroom } from '../types';

interface UserManagerProps {
  users: UserAccount[];
  classes: Classroom[];
  currentUser: UserAccount;
  onSaveUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: UserAccount) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({
  users,
  classes,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
}) => {
  const isAuthorized = currentUser.role === 'admin' || currentUser.permissions.canManageUsers;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  
  // Permissions
  const [canViewTuition, setCanViewTuition] = useState(false);
  const [canEditTuition, setCanEditTuition] = useState(false);
  const [canMarkAttendance, setCanMarkAttendance] = useState(true);
  const [canManageMakeup, setCanManageMakeup] = useState(true);
  const [canManageStudents, setCanManageStudents] = useState(false);
  const [canManageClasses, setCanManageClasses] = useState(false);

  // If not admin or manager with manage users permission, show security block
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Quyền truy cập bị giới hạn
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Chỉ <strong>Admin</strong> mới có quyền cấp tài khoản và phân quyền cho giáo viên. Tài khoản của bạn hiện là <span className="font-semibold text-indigo-700">{currentUser.fullName} ({currentUser.role})</span>.
        </p>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('123456');
    setRole('teacher');
    setAssignedClassIds([]);
    // Giáo viên: KHÔNG xem được học phí (chỉ admin & manager mới xem được)
    setCanViewTuition(false);
    setCanEditTuition(false);
    setCanMarkAttendance(true);
    setCanManageMakeup(true);
    setCanManageStudents(false);
    setCanManageClasses(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone);
    setPassword(user.password || '123456');
    setRole(user.role);
    setAssignedClassIds([...user.assignedClassIds]);
    // Chỉ admin & manager mới xem được học phí
    setCanViewTuition(user.role === 'admin' || user.role === 'manager');
    setCanEditTuition(user.role === 'admin' || user.role === 'manager');
    setCanMarkAttendance(user.permissions.canMarkAttendance);
    setCanManageMakeup(user.permissions.canManageMakeup);
    setCanManageStudents(user.permissions.canManageStudents);
    setCanManageClasses(user.permissions.canManageClasses);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setCanViewTuition(true);
      setCanEditTuition(true);
      setCanMarkAttendance(true);
      setCanManageMakeup(true);
      setCanManageStudents(true);
      setCanManageClasses(true);
    } else if (newRole === 'manager') {
      setCanViewTuition(true); // Quản lý được xem học phí
      setCanEditTuition(true);
      setCanMarkAttendance(true);
      setCanManageMakeup(true);
      setCanManageStudents(true);
      setCanManageClasses(true);
    } else {
      // Giáo viên: KHÔNG ĐƯỢC XEM HỌC PHÍ (quy định chỉ admin & manager)
      setCanViewTuition(false);
      setCanEditTuition(false);
      setCanMarkAttendance(true);
      setCanManageMakeup(true);
      setCanManageStudents(false);
      setCanManageClasses(false);
    }
  };

  const handleToggleClass = (classId: string) => {
    if (assignedClassIds.includes(classId)) {
      setAssignedClassIds(assignedClassIds.filter((id) => id !== classId));
    } else {
      setAssignedClassIds([...assignedClassIds, classId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      alert('Vui lòng điền tên đăng nhập và họ tên người dùng!');
      return;
    }

    // QUY ĐỊNH BẢO MẬT: Chỉ admin và quản lý mới được xem học phí!
    const allowTuition = role === 'admin' || role === 'manager';

    const userToSave: UserAccount = {
      id: editingUser ? editingUser.id : `USR-${Date.now().toString().slice(-5)}`,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password || '123456',
      role,
      assignedClassIds,
      status: editingUser ? editingUser.status : 'active',
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      permissions: {
        canViewTuition: allowTuition,
        canEditTuition: allowTuition,
        canManageUsers: role === 'admin',
        canManageClasses: role === 'admin' ? true : canManageClasses,
        canManageStudents: role === 'admin' ? true : canManageStudents,
        canMarkAttendance,
        canManageMakeup,
      },
    };

    onSaveUser(userToSave);
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const matchName = u.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchUser = u.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = u.phone.includes(searchTerm);
      if (!matchName && !matchUser && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Phân Quyền & Quản Lý Tài Khoản Giáo Viên</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin cấp tài khoản cho giáo viên & quản lý. Chỉ Admin và Quản lý mới được phân quyền xem học phí.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-300 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cấp tài khoản giáo viên mới</span>
        </button>
      </div>

      {/* Role explanation info box */}
      <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-indigo-950 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Chính sách bảo mật học phí:</span>
          </div>
          <div className="text-slate-600">
            • <strong className="text-slate-900">Admin & Quản lý:</strong> Toàn quyền xem báo cáo học phí, số tiền, và xuất mã VietQR thu tiền.
          </div>
          <div className="text-slate-600">
            • <strong className="text-slate-900">Giáo viên:</strong> Chỉ xem được sĩ số, chuyên cần, điểm danh và xếp ca học bù của các lớp được phân công. Tab và số liệu học phí bị ẩn hoàn toàn.
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
            Đang đăng nhập: <strong>{currentUser.fullName}</strong> ({currentUser.role})
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Role tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả tài khoản ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('teacher')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              roleFilter === 'teacher'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <span>Giáo viên</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {users.filter((u) => u.role === 'teacher').length}
            </span>
          </button>
          <button
            onClick={() => setRoleFilter('manager')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              roleFilter === 'manager'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>Quản lý</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {users.filter((u) => u.role === 'manager').length}
            </span>
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              roleFilter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <span>Admin</span>
            <span className="text-[10px] font-bold bg-white/30 px-1.5 rounded-full">
              {users.filter((u) => u.role === 'admin').length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm theo họ tên, username, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isCurrent = user.id === currentUser.id;
          const assignedClasses = classes.filter((c) =>
            user.assignedClassIds.includes(c.id)
          );

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-2xs ${
                isCurrent
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-slate-200/90 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header: Role & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {user.role === 'admin' && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                        Admin
                      </span>
                    )}
                    {user.role === 'manager' && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        Quản lý
                      </span>
                    )}
                    {user.role === 'teacher' && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                        Giáo viên
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        Đang dùng
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Sửa quyền / Mật khẩu"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xoá tài khoản ${user.fullName}?`)) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xoá tài khoản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile info */}
                <div className="mt-3">
                  <div className="font-bold text-slate-900 text-base">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-mono font-semibold text-indigo-700">@{user.username}</span>
                    <span>·</span>
                    <span className="font-mono">{user.phone || user.email}</span>
                    <span>·</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[11px] text-slate-700">
                      MK: <strong>{user.password || '123'}</strong>
                    </span>
                  </div>
                </div>

                {/* Assigned Classes */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    <span>Lớp phụ trách:</span>
                  </div>
                  {user.role === 'admin' || user.role === 'manager' || user.assignedClassIds.length === 0 ? (
                    <div className="font-semibold text-slate-700">
                      Tất cả các lớp trong trung tâm
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {assignedClasses.map((cls) => (
                        <span
                          key={cls.id}
                          className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold text-indigo-700 border border-slate-200"
                        >
                          {cls.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Permissions Badges */}
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                    <span className="text-slate-500">Xem học phí & VietQR:</span>
                    {user.role === 'admin' || user.role === 'manager' ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Được phép xem
                      </span>
                    ) : (
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Đã chặn (Ẩn học phí)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                    <span className="text-slate-500">Tài khoản ngân hàng:</span>
                    {user.role === 'admin' || user.role === 'manager' ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Xem & chỉnh sửa
                      </span>
                    ) : (
                      <span className="font-bold text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Đã khoá bảo mật
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                    <span className="text-slate-500">Điểm danh & BTVN:</span>
                    <span className="font-semibold text-slate-800">
                      {user.permissions.canMarkAttendance ? '✓ Cho phép' : 'Chặn'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="text-slate-500">Xếp lịch học bù:</span>
                    <span className="font-semibold text-slate-800">
                      {user.permissions.canManageMakeup ? '✓ Cho phép' : 'Chặn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions for Admin */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(user)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Sửa quyền & Mật khẩu</span>
                </button>
                {!isCurrent ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xoá tài khoản giáo viên "${user.fullName}" (@${user.username})?`)) {
                        onDeleteUser(user.id);
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors flex items-center justify-center gap-1 border border-rose-200/60"
                    title="Xoá tài khoản này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xoá</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">
                    Tài khoản của bạn
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chưa có tài khoản giáo viên nào
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Admin có thể cấp tài khoản đăng nhập riêng và phân công lớp dạy cho từng giáo viên ngay tại đây.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-300 transition-all inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cấp tài khoản giáo viên mới</span>
          </button>
        </div>
      )}

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>{editingUser ? 'Phân quyền tài khoản' : 'Cấp tài khoản giáo viên mới'}</span>
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
                    Tên đăng nhập (Username)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="hoangnam, mailinh..."
                    className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mặc định: 123456"
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên Giáo viên / Quản lý
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: ThS. Nguyễn Hoàng Nam"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gv@thaiha.edu.vn"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Vai trò trong trung tâm
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('teacher')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'teacher'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">Giáo viên</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Ẩn học phí</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('manager')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'manager'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">Quản lý</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Xem học phí</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      role === 'admin'
                        ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">Admin</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Toàn quyền</div>
                  </button>
                </div>
              </div>

              {/* Phân công lớp phụ trách */}
              {role === 'teacher' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phân công lớp giáo viên này phụ trách
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                    {classes.map((cls) => {
                      const isChecked = assignedClassIds.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className="flex items-center gap-2 p-1 rounded-lg hover:bg-white cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleClass(cls.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-slate-800">{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phân quyền chi tiết */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-900 text-xs">
                  Thiết lập quyền truy cập chi tiết
                </div>

                {/* Quyền xem học phí (Điểm nhấn đề bài: Chỉ Admin và Quản lý mới xem được học phí) */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Xem học phí & hoá đơn VietQR</span>
                    </div>
                    {role === 'admin' || role === 'manager' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Cho phép ({role === 'admin' ? 'Admin' : 'Quản lý'})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Đã chặn (Giáo viên)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Quy định bảo mật: <strong>Chỉ Admin và Quản lý mới được xem học phí</strong>. Tài khoản giáo viên luôn bị ẩn menu Học phí và các số liệu tiền bạc.
                  </div>
                </div>

                {/* Quyền quản lý tài khoản ngân hàng (Chỉ Admin và Quản lý) */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Xem & chỉnh sửa Tài khoản Ngân hàng</span>
                    </div>
                    {role === 'admin' || role === 'manager' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Cho phép ({role === 'admin' ? 'Admin' : 'Quản lý'})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Đã chặn (Giáo viên)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Quy định bảo mật: <strong>Chỉ có Admin và Quản lý mới xem và chỉnh sửa được mục tài khoản ngân hàng</strong>.
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-700 pt-1">
                  Phân quyền nghiệp vụ cho tài khoản này:
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-1.5 rounded bg-white border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canMarkAttendance}
                      onChange={(e) => setCanMarkAttendance(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Điểm danh học sinh</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded bg-white border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canManageMakeup}
                      onChange={(e) => setCanManageMakeup(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Xếp lịch học bù</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded bg-white border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canManageStudents}
                      onChange={(e) => setCanManageStudents(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Sửa hồ sơ học sinh</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded bg-white border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canManageClasses}
                      onChange={(e) => setCanManageClasses(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Quản lý lớp học</span>
                  </label>
                </div>
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
                  {editingUser ? 'Cập nhật tài khoản' : 'Cấp tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
