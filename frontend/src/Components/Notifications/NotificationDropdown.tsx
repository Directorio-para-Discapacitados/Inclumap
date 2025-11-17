import React from 'react';
import { Notification } from '../../services/notificationService';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  notifications: Notification[];
  isOpen: boolean;
  onMarkAsRead: (id: number) => void;
  onNavigate: (notification: Notification) => void;
  loading: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onMarkAsRead,
  onNavigate,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notificaciones</h3>
      </div>
      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">
            <div className="spinner"></div>
            <p>Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.notification_id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
