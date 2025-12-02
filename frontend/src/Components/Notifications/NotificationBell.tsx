import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead, deleteNotification, Notification } from '../../services/notificationService';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Cargar notificaciones
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error: any) {
      // Solo mostrar error si no es un problema de autenticación (401)
      if (error?.response?.status !== 401) {
        console.error('Error al cargar notificaciones:', error?.response?.data || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cada 10 minutos
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 600000); // 10 minutos
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      // Actualizar el estado inmediatamente para mejor UX
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      
      // Luego hacer la llamada al backend
      await markAsRead(id);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      // Revertir el cambio si falla
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: false } : n))
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };



  const handleNavigate = async (notification: Notification) => {
    setIsOpen(false);
    
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await handleMarkAsRead(notification.notification_id);
    }

    // Navegar según el tipo de notificación
    if (notification.type === 'SUGGESTION') {
      // Navegar al negocio recomendado
      navigate(`/local/${notification.related_id}`);
    } 
    else if (notification.type === 'REVIEW_ALERT') {
      // Navegar a la página de moderación de contenido ofensivo
      navigate('/admin/moderation/offensive');
    } 
    else if (notification.type === 'REVIEW_ATTENTION') {
      // Navegar a las reseñas incoherentes
      navigate('/reviews?filter=incoherent');
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell-button" onClick={toggleDropdown}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="notification-bell-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        notifications={notifications}
        isOpen={isOpen}
        onMarkAsRead={handleMarkAsRead}
        onNavigate={handleNavigate}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
};

export default NotificationBell;
