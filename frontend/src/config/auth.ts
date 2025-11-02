
import { API_URL } from '../config/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
    
    body: JSON.stringify({ idToken }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || 'Error al autenticar con Google');
  }
  return json; 
};