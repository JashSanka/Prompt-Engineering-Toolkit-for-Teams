'use client';
import { useApp } from '@/lib/store';

const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

export default function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${toast.type} ${toast.fading ? 'fade-out' : ''}`}
        >
          <span>{icons[toast.type] || '📢'}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
