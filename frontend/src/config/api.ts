import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_URL = 'http://localhost:9080'; 

const apiClient = axios.create({
  baseURL: API_URL, 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Variable para controlar si ya se está mostrando el modal
let isShowingSessionModal = false;

// Callbacks que se establecerán desde el componente App
let showSessionModalCallback: (() => Promise<boolean>) | null = null;

// Función para establecer el callback del modal desde el componente principal
export const setSessionModalCallback = (callback: () => Promise<boolean>) => {
  showSessionModalCallback = callback;
};

// Variable para evitar múltiples intentos de refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de petición para agregar el token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si el error es 401 y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Verificar si la petición fallida fue al endpoint de refresh
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Si el refresh falló, no intentar de nuevo, simplemente desloguear
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // Si ya se está refrescando, agregar a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Mostrar modal si está disponible y no se está mostrando ya
        if (showSessionModalCallback && !isShowingSessionModal) {
          isShowingSessionModal = true;
          const userWantsToKeepSession = await showSessionModalCallback();
          isShowingSessionModal = false;

          if (!userWantsToKeepSession) {
            // Usuario decidió cerrar sesión
            localStorage.removeItem('token');
            processQueue(new Error('Usuario cerró sesión'), null);
            isRefreshing = false;
            window.location.href = '/login';
            return Promise.reject(new Error('Sesión cerrada por el usuario'));
          }
        }

        // Intentar refrescar el token
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          throw new Error('No hay token disponible');
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          }
        );

        const newToken = response.data.access_token || response.data.token;

        if (newToken) {
          localStorage.setItem('token', newToken);
          
          // Actualizar el header de la petición original
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          processQueue(null, newToken);
          isRefreshing = false;

          // Reintentar la petición original con el nuevo token
          return apiClient(originalRequest);
        } else {
          throw new Error('No se recibió un nuevo token');
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const api = apiClient;
