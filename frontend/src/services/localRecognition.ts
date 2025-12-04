/// <reference types="vite/client" />

import axios, { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9080";

interface LocalRecognitionResponse {
  businessName: string;
  confidence: number;
  status: string;
  accessibility?: Record<string, any>;
  id?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

interface LocalRecognitionError {
  message: string;
  code?: string;
  details?: any;
}

class LocalRecognitionService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 segundos para procesar imágenes
    });

    // Interceptor para agregar token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de respuesta
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Envía una imagen para reconocimiento de local
   * @param imageFile - Archivo de imagen (jpg, png, webp)
   * @returns Promise con los resultados del reconocimiento
   */
  async recognizeLocal(
    imageFile: File
  ): Promise<LocalRecognitionResponse> {
    try {
      // Validar que sea una imagen
      if (!imageFile.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
      }

      // --- CAMBIO: Agregado soporte para WebP ---
      const allowedFormats = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedFormats.includes(imageFile.type)) {
        throw new Error("Solo se aceptan imágenes JPG, PNG o WebP");
      }

      // Validar tamaño máximo (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        throw new Error("La imagen no debe superar 5MB");
      }

      // Crear FormData
      const formData = new FormData();
      formData.append("image", imageFile);

      // Enviar al endpoint
      const response = await this.api.post<LocalRecognitionResponse>(
        "/local-recognition",
        formData
      );

      return response.data;
    } catch (error: any) {
      const errorMessage = this.handleError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Envía una imagen para reconocimiento con ubicación
   * @param imageFile - Archivo de imagen
   * @param latitude - Latitud (opcional)
   * @param longitude - Longitud (opcional)
   * @returns Promise con los resultados del reconocimiento
   */
  async recognizeLocalWithLocation(
    imageFile: File,
    latitude?: number,
    longitude?: number
  ): Promise<LocalRecognitionResponse> {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      if (latitude !== undefined && longitude !== undefined) {
        formData.append("latitude", latitude.toString());
        formData.append("longitude", longitude.toString());
      }

      const response = await this.api.post<LocalRecognitionResponse>(
        "/local-recognition",
        formData
      );

      return response.data;
    } catch (error: any) {
      const errorMessage = this.handleError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtiene el historial de reconocimientos del usuario
   * @returns Promise con el historial
   */
  async getRecognitionHistory(): Promise<LocalRecognitionResponse[]> {
    try {
      const response = await this.api.get<LocalRecognitionResponse[]>(
        "/local-recognition/history"
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = this.handleError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Maneja los errores de la API
   */
  private handleError(error: any): string {
    // Error de la API
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Error de conexión
    if (error.code === "ECONNABORTED") {
      return "La solicitud tardó demasiado. Intenta con una imagen más pequeña";
    }

    // Error de red
    if (!navigator.onLine) {
      return "No hay conexión a Internet";
    }

    // Errores comunes de HTTP
    const statusErrors: Record<number, string> = {
      400: "Solicitud inválida. Verifica la imagen",
      401: "No estás autenticado. Inicia sesión",
      403: "No tienes permiso para realizar esta acción",
      404: "El servicio no está disponible",
      413: "La imagen es demasiado grande",
      429: "Demasiadas solicitudes. Intenta más tarde",
      500: "Error del servidor. Intenta más tarde",
      503: "El servicio no está disponible",
    };

    if (error.response?.status && statusErrors[error.response.status]) {
      return statusErrors[error.response.status];
    }

    // Error genérico
    return error.message || "Error al procesar la imagen";
  }
}

// Exportar instancia singleton
export const localRecognitionService = new LocalRecognitionService();

// Exportar tipos
export type { LocalRecognitionResponse, LocalRecognitionError };
