import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✏️';
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal-header ${type}`}>
          <div className="confirm-modal-icon">{getIcon()}</div>
          <h2 className="confirm-modal-title">{title}</h2>
          <button className="confirm-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
          {details && (
            <div className="confirm-modal-details">
              <div className="details-label">Comentario:</div>
              <div className="details-content">"{details}"</div>
            </div>
          )}
          <div className="confirm-modal-warning">
            <span className="warning-icon">⚠️</span>
            Esta acción no se puede deshacer
          </div>
        </div>

        <div className="confirm-modal-footer">
          <button className="confirm-modal-btn cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
          <button className="confirm-modal-btn confirm-btn" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
