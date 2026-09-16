import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Bottom sheet on phones, centred dialog on larger screens.
export default function Sheet({ open, onClose, title, children, wide = false }) {
  useEffect(() => { if (!open) return; const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); document.body.classList.add('sheet-open'); return () => { window.removeEventListener('keydown', k); document.body.classList.remove('sheet-open'); }; }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="sheet-back" onClick={onClose}>
      <div className={'sheet' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="grab" />
        {title && <div className="sheet-h"><div className="sheet-t">{title}</div><button className="ib x" onClick={onClose} aria-label="Close">×</button></div>}
        <div className="sheet-b">{children}</div>
      </div>
    </div>, document.body);
}
