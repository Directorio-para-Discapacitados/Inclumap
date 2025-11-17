import React from 'react';
import { Notification } from '../../services/notificationService';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onNavigate: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onNavigate,
}) => {
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
    return notification.type === 'SUGGESTION' ? '⭐' : '⚠️';
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.notification_id);
    }
    onNavigate(notification);
  };

  return (
    <div
      className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        <p className="notification-message">{notification.message}</p>
        <span className="notification-time">{getTimeAgo(notification.created_at)}</span>
      </div>
      {!notification.is_read && <div className="notification-badge"></div>}
    </div>
  );
};

export default NotificationItem;
