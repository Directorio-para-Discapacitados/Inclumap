import React from 'react';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  // Propiedades para checkbox opcional
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  details = [],
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  checkboxLabel,
  checkboxChecked = false,
  onCheckboxChange
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '🗑️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleOverlayClick}>
      <div className={`confirmation-modal confirmation-modal-${type}`}>
        <div className="confirmation-modal-header">
          <span className="confirmation-modal-icon">{getIcon()}</span>
          <h2 className="confirmation-modal-title">{title}</h2>
        </div>
        
        <div className="confirmation-modal-body">
          <p className="confirmation-modal-message">{message}</p>
          
          {details.length > 0 && (
            <div className="confirmation-modal-details">
              <p className="confirmation-modal-details-title">Esta acción:</p>
              <ul className="confirmation-modal-details-list">
                {details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
              <p className="confirmation-modal-warning">
                <strong>⚠️ Esta acción NO se puede deshacer</strong>
              </p>
            </div>
          )}

          {/* Checkbox opcional */}
          {checkboxLabel && onCheckboxChange && (
            <div className="confirmation-modal-checkbox">
              <label className="confirmation-modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={checkboxChecked}
                  onChange={(e) => onCheckboxChange(e.target.checked)}
                  className="confirmation-modal-checkbox-input"
                />
                <span className="confirmation-modal-checkbox-text">{checkboxLabel}</span>
              </label>
            </div>
          )}
        </div>
        
        <div className="confirmation-modal-footer">
          <button
            className="confirmation-modal-btn confirmation-modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`confirmation-modal-btn confirmation-modal-btn-confirm confirmation-modal-btn-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;