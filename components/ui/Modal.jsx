'use client';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: size === 'lg' ? 680 : size === 'sm' ? 360 : 480 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '1.1rem' }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
