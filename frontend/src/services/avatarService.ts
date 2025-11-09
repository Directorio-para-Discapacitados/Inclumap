// frontend/src/services/avatarService.ts

import { API_URL } from '../config/api';

export interface AvatarResponse {
  message: string;
  avatar_url: string;
}

export interface DeleteAvatarResponse {
  message: string;
}

class AvatarService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async uploadAvatar(userId: number, file: File): Promise<AvatarResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_URL}/user/${userId}/avatar`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteAvatar(userId: number): Promise<DeleteAvatarResponse> {
    const response = await fetch(`${API_URL}/user/${userId}/avatar`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const avatarService = new AvatarService();