import { API_URL } from '../config/api';

export const getAllPeople = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No estás autenticado.');
  const response = await fetch(`${API_URL}/people`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Error al obtener personas');
  return await response.json();
};
