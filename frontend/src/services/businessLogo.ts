import { API_URL } from '../config/api';

export interface LogoUploadResponse {
  message: string;
}

class BusinessLogoService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Subir logo del negocio
   * @param file - Archivo de imagen (png, jpeg, jpg)
   * @returns Mensaje de éxito
   */
  async uploadLogo(file: File): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch(`${API_URL}/business/logo`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }
}

export const businessLogoService = new BusinessLogoService();
