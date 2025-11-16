/**
 * Servicio dedicado para operaciones de propietarios
 * Maneja degradación, eliminación y asignación de propietarios de negocios
 */

import { API_URL } from '../config/api';

/**
 * Degradar propietario: Remueve el rol de propietario pero conserva el negocio
 * El negocio quedará disponible para ser reasignado a otro propietario
 * 
 * @param businessId - ID del negocio
 * @param userId - ID del usuario propietario a degradar
 */
export const degradarPropietario = async (businessId: number, userId: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Paso 1: Remover el rol de propietario (ID: 3) del usuario
    const removeRoleResponse = await fetch(`${API_URL}/user-rol`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        user_id: userId,
        rol_id: 3 // 3 = rol propietario
      })
    });

    if (!removeRoleResponse.ok) {
      const errorText = await removeRoleResponse.text();
      throw new Error(`Error al remover rol de propietario: ${errorText || removeRoleResponse.statusText}`);
    }

    // Paso 2: Limpiar la relación user_id en el negocio
    const clearOwnerResponse = await fetch(`${API_URL}/business/${businessId}/clear-owner`, {
      method: 'PATCH',
      headers
    });

    if (!clearOwnerResponse.ok) {
      const errorText = await clearOwnerResponse.text();
      // Si falla este paso pero el rol ya se removió, no es crítico
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Eliminar negocio completamente con opción de eliminar también al propietario
 * 
 * @param businessId - ID del negocio a eliminar
 * @param deleteOwner - Si es true, también elimina al usuario propietario con todos sus roles
 */
export const eliminarNegocioCompleto = async (
  businessId: number, 
  deleteOwner: boolean = false
): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}/business/${businessId}/complete?deleteOwner=${deleteOwner}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al eliminar negocio: ${errorText || response.statusText}`);
    }

    const result = await response.json();
    
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener lista de negocios sin propietario asignado
 * Útil para mostrar opciones de negocios disponibles para asignar
 */
export const obtenerNegociosDisponibles = async (): Promise<any[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}/business/available/unowned`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener negocios disponibles: ${errorText || response.statusText}`);
    }

    const businesses = await response.json();
    return businesses;
  } catch (error) {
    throw error;
  }
};

/**
 * Asignar un negocio a un usuario (convertirlo en propietario)
 * 
 * @param businessId - ID del negocio a asignar
 * @param userId - ID del usuario que será el nuevo propietario
 */
export const asignarNegocioAPropietario = async (
  businessId: number, 
  userId: number
): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}/business/${businessId}/assign-owner/${userId}`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al asignar negocio: ${errorText || response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};
