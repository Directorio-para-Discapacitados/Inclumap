import React, { useState, useRef } from 'react';
import { Notification } from '../../services/notificationService';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onNavigate: (notification: Notification) => void;
  onDelete: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onNavigate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    return `Hace ${Math.floor(diffInSeconds / 604800)} semanas`;
  };

  const getIcon = (): string => {
    if (notification.type === 'SUGGESTION') return '⭐';
    if (notification.type === 'REVIEW_ALERT') return '🚨';
    if (notification.type === 'REVIEW_ATTENTION') return '⚠️';
    return '📢';
  };

  // --- NUEVA FUNCIÓN: Determinar clase según tipo ---
  const getTypeClass = (): string => {
    if (notification.type === 'SUGGESTION') return 'type-suggestion';
    // Aplica para REVIEW_ALERT y REVIEW_ATTENTION (ambas son alertas)
    return 'type-alert'; 
  };

  // --- NUEVA FUNCIÓN: Obtener título según tipo ---
  const getTitle = (): string => {
    if (notification.type === 'SUGGESTION') return 'Recomendación';
    if (notification.type === 'REVIEW_ALERT') return '¡Alerta de Moderación!';
    if (notification.type === 'REVIEW_ATTENTION') return 'Revisión Requerida';
    return 'Notificación';
  };

  const handleClick = async () => {
    if (!isDragging && translateX === 0) {
      // Marcar como leída primero si no lo está
      if (!notification.is_read) {
        onMarkAsRead(notification.notification_id);
      }
      // Navegar después
      onNavigate(notification);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
    const diff = e.touches[0].clientX - startX;
    if (diff > 0) {
      setTranslateX(Math.min(diff, 100)); 
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX > 80) {
      onDelete(notification.notification_id);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsDragging(true);
      setStartX(e.clientX);
      setCurrentX(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
    const diff = e.clientX - startX;
    if (diff > 0) {
      setTranslateX(Math.min(diff, 100));
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (translateX > 80) {
      onDelete(notification.notification_id);
    } else {
      setTranslateX(0);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.notification_id);
  };

  return (
    <div className={`notification-item-container ${translateX > 10 ? 'swiped' : ''}`}>
      <div className="notification-delete-background">
        <svg className="delete-icon-bg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div
        ref={itemRef}
        // CAMBIO AQUÍ: Agregamos ${getTypeClass()}
        className={`notification-item ${notification.is_read ? 'read' : 'unread'} ${getTypeClass()}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
        }}
      >
        <div className="notification-icon">{getIcon()}</div>
        <div className="notification-content">
          <p className="notification-title">{getTitle()}</p>
          <p className={`notification-message ${isExpanded ? 'expanded' : ''}`}>
            {notification.message}
          </p>
          {notification.message && notification.message.length > 50 && (
            <button 
              className="expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? '▼ Ver menos' : '▶ Ver más'}
            </button>
          )}
          <span className="notification-time">{getTimeAgo(notification.created_at)}</span>
        </div>
        {!notification.is_read && <div className="notification-badge"></div>}
        <button 
          className="notification-delete-btn"
          onClick={handleDeleteClick}
          aria-label="Eliminar notificación"
          title="Eliminar notificación"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
