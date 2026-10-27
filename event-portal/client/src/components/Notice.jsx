import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';

const icons = { success: CircleCheck, error: CircleAlert, info: Info };

// A message box for success, error or info. Pass onClose to show a close button.
export default function Notice({ type = 'info', children, onClose }) {
  const Icon = icons[type];

  return (
    <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={20} className="notice-icon" />
      <div className="notice-text">{children}</div>
      {onClose && (
        <button type="button" className="icon-button" onClick={onClose} aria-label="Dismiss message">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
