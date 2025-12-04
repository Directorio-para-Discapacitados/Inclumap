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
    const token = localStorage.getItem('token');
    const url = `${API_URL}/business/${businessId}/images`;

    files.forEach((file, index) => {
      formData.append('images', file);
    });

    try {

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
    } catch (error: any) {
      throw error;
    }
  }

  async deleteImage(businessId: number, imageId: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/business/${businessId}/images/${imageId}`;



    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');

        throw new Error(
          errorText ||
            `Error al eliminar imagen: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json().catch(() => ({ message: 'Imagen eliminada correctamente' }));

      return result;
    } catch (error: any) {
      throw error;
    }
  }
}

export const businessImagesService = new BusinessImagesService();
