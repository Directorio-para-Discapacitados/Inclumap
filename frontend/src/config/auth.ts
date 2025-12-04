// frontend/src/config/auth.ts

import { API_URL } from '../config/api';

// ... (registerUser, loginUser, loginWithGoogle, ChangePasswordData, changeUserPassword... se quedan igual)

export const registerUser = async (data: { name: string; email: string; password: string; }) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al registrar usuario');
  }
  return response.json();
};

export const loginUser = async (data: { user_email: string; user_password: string }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || 'Error al iniciar sesión');
  }
  return json; 
};

export const loginWithGoogle = async (idToken: string) => {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || 'Error al autenticar con Google');
  }
  return json; 
};

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const changeUserPassword = async (data: ChangePasswordData, token: string) => {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al cambiar la contraseña');
  }
  return response.json();
};

export const requestPasswordReset = async (email: string) => {
  const response = await fetch(`${API_URL}/auth/request-reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_email: email }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al solicitar el reseteo');
  }
  return response.json();
};

export const verifyResetCode = async (code: string) => {
  const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Código inválido o expirado');
  }
  return response.json();
};

export const resetPassword = async (code: string, newPassword: string) => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al resetear la contraseña');
  }
  return response.json();
};
