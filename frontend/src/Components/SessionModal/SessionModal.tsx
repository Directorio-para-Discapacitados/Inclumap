import React, { useEffect, useState } from 'react';
import './SessionModal.css';

interface SessionModalProps {
  isOpen: boolean;
  onKeepSession: () => void;
  onCloseSession: () => void;
  countdown?: number; // Segundos para auto-cerrar sesión
}

const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onKeepSession,
  onCloseSession,
  countdown = 60
}) => {
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(countdown);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCloseSession(); // Auto-cerrar sesión cuando el tiempo se acabe
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown, onCloseSession]);

  if (!isOpen) return null;

  return (
    <div className="session-modal-overlay">
      <div className="session-modal-container">
        <div className="session-modal-header">
          <h2>⚠️ Tu sesión está por expirar</h2>
        </div>
        
        <div className="session-modal-body">
          <p>¿Sigues activo? Tu sesión está por expirar.</p>
          <p className="session-modal-warning">
            Si no respondes, cerraremos tu sesión automáticamente por seguridad.
          </p>
        </div>

        <div className="session-modal-actions">
          <button 
            className="session-modal-btn session-modal-btn-keep"
            onClick={onKeepSession}
          >
            Mantener Sesión
          </button>
          <button 
            className="session-modal-btn session-modal-btn-close"
            onClick={onCloseSession}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
