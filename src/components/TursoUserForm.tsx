import React, { useState } from 'react';
import { Database, X } from 'lucide-react';

interface TursoUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TursoUserForm: React.FC<TursoUserFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Đẩy dữ liệu về API Route trên Vercel
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }), // Dữ liệu từ Form
      });

      const result = await response.json();
      if (result.success) {
        alert('Lưu thành công!');
        setName('');
        setEmail('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert('Lỗi: ' + result.error);
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể kết nối đến máy chủ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thêm Người Dùng (Turso DB)</h3>
              <p className="text-xs text-slate-500">Lưu dữ liệu qua API Route /api/users</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Họ và tên (name)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ví dụ: nguyenvana@gmail.com"
              required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm shadow-indigo-300 active:scale-95 flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{loading ? 'Đang lưu...' : 'Lưu vào Turso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
