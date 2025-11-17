import { api } from '../config/api';

export interface Notification {
  notification_id: number;
  type: 'REVIEW_ALERT' | 'SUGGESTION';
  message: string;
  related_id: number;
  is_read: boolean;
  created_at: string;
}

/**
 * Obtiene todas las notificaciones del usuario autenticado
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

/**
 * Marca una notificación como leída
 */
export const markAsRead = async (notificationId: number): Promise<Notification> => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Elimina una notificación
 */
export const deleteNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
