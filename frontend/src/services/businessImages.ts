import { API_URL } from '../config/api';

export interface BusinessImageDto {
  id: number;
  url: string;
}

export interface UploadBusinessImagesResponse {
  message: string;
  images: BusinessImageDto[];
}

class BusinessImagesService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }
    return {
      Authorization: `Bearer ${token}`,
    } as HeadersInit;
  }

  async uploadImages(
    businessId: number,
    files: File[],
  ): Promise<UploadBusinessImagesResponse> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_URL}/business/${businessId}/images`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          `Error al subir imágenes: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result as UploadBusinessImagesResponse;
  }

  async deleteImage(businessId: number, imageId: number): Promise<void> {
    const response = await fetch(
      `${API_URL}/business/${businessId}/images/${imageId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        errorText ||
          `Error al eliminar imagen: ${response.status} ${response.statusText}`,
      );
    }
  }
}

export const businessImagesService = new BusinessImagesService();
