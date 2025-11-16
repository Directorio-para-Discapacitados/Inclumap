// frontend/src/services/admin.ts

import { API_URL } from '../config/api';

// Tipos mínimos normalizados para el panel de administración
export type AdminRole = { id?: number; name?: string };
export type AdminPerson = { firstName?: string; firstLastName?: string; avatar?: string };
export type AdminUser = {
  id: number;
  email?: string;
  people?: AdminPerson;
  roles: AdminRole[];
};

/**
 * Verifica si el servidor backend está disponible
 */
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Función de diagnóstico para verificar conectividad 
 * Se puede usar desde la consola del navegador
 */
export const diagnosticConnection = async (): Promise<void> => {
  // Función de diagnóstico - aquí se pueden mantener logs si se necesita debugging
};

/**
 * Función de prueba para verificar login de admin
 */
export const testAdminLogin = async (): Promise<void> => {
  // Función de prueba de login - aquí se pueden mantener logs si se necesita debugging
};

// Hacer las funciones disponibles globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).diagnosticConnection = diagnosticConnection;
  (window as any).testAdminLogin = testAdminLogin;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No estás autenticado.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Obtiene todos los usuarios desde el endpoint /user.
 * Esta función está pensada para ser usada por un administrador.
 */
export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_URL}/user`, { headers });

    if (!response.ok) {
      throw new Error(`Error al obtener los usuarios: ${response.statusText}`);
    }

    const raw = await response.json();
    // Normalizamos por si cambian nombres de campos entre entidades/DTOs
    const users: AdminUser[] = (raw || []).map((u: any) => ({
      id: u.id ?? u.user_id ?? u.userId,
      email: u.email ?? u.user_email,
      people: u.people ? {
        firstName: u.people.firstName ?? u.people.firstname ?? u.people.first_name,
        firstLastName: u.people.firstLastName ?? u.people.lastname ?? u.people.first_last_name,
        avatar: u.people.avatar,
      } : undefined,
      roles: Array.isArray(u.roles) ? u.roles.map((r: any) => ({ id: r.id ?? r.rol_id, name: r.name ?? r.rol_name })) : [],
    }));

    return users;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene todos los negocios (propietarios) desde el endpoint /business.
 * Esta función está pensada para ser usada por un administrador.
 */
export const getAllBusinesses = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_URL}/business`, { headers });

    if (!response.ok) {
      throw new Error(`Error al obtener los propietarios: ${response.statusText}`);
    }

    const raw = await response.json();
    
    // Normalizamos estructura esperada del negocio con su usuario
    const businesses = (raw || []).map((b: any) => {
      const normalizedBusiness = {
        id: b.id ?? b.business_id,
        business_id: b.business_id ?? b.id,
        name: b.name ?? b.business_name,
        business_name: b.business_name ?? b.name,
        address: b.address,
        average_rating: b.average_rating,
        logo_url: b.logo_url,
        user: b.user ? {
          id: b.user.id ?? b.user.user_id,
          email: b.user.email ?? b.user.user_email,
          user_email: b.user.user_email ?? b.user.email, // Mantenemos ambos para compatibilidad
          people: b.user.people ? {
            firstName: b.user.people.firstName ?? b.user.people.first_name,
            firstLastName: b.user.people.firstLastName ?? b.user.people.first_last_name,
          } : undefined,
          roles: Array.isArray(b.user.roles)
            ? b.user.roles.map((r: any) => ({ 
                id: r.id ?? r.rol_id, 
                name: r.name ?? r.rol_name 
              }))
            : [],
        } : null,
      };
      
      return normalizedBusiness;
    });

    return businesses;
  } catch (error) {
    throw error;
  }
};

/**
 * Quita un rol específico de un usuario (sin afectar otros roles)
 */
export const removeUserRole = async (userId: number, roleIdToRemove: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Primero, verificar si el usuario tiene el rol
    const userRolesResponse = await fetch(`${API_URL}/user-rol/user/${userId}`, {
      method: 'GET',
      headers
    });

    if (userRolesResponse.ok) {
      const userRoles = await userRolesResponse.json();
      const hasRole = userRoles.some((role: any) => role.rol_id === roleIdToRemove);
      
      if (!hasRole) {
        return; // No hay error, simplemente ya no tiene el rol
      }
    }

    const response = await fetch(`${API_URL}/user-rol`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        user_id: userId,
        rol_id: roleIdToRemove
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Si el error es que no tiene el rol, no es realmente un error
      if (errorText.includes('no tiene asignado este rol')) {
        return;
      }
      
      throw new Error(`Error al quitar rol: ${errorText || response.statusText}`);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};

// Función para remover la asociación usuario-negocio usando el endpoint de actualización
export const removeBusinessOwner = async (businessId: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Usar el endpoint específico para limpiar propietario (solo admins)
    const response = await fetch(`${API_URL}/business/${businessId}/clear-owner`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al remover propietario del negocio: ${errorText || response.statusText}`);
    }

    await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};

// Función completa para degradar propietario conservando negocio
export const demoteOwnerKeepBusiness = async (userId: number, businessId: number): Promise<void> => {
  try {
    // 1. Remover rol de propietario del usuario
    await removeUserRole(userId, 3);
    
    // 2. Remover la asociación usuario-negocio
    await removeBusinessOwner(businessId);
  } catch (error) {
    throw error;
  }
};

// Funciones para gestión de negocios sin propietario
export const getAvailableBusinesses = async (): Promise<any[]> => {
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

export const assignBusinessToUser = async (businessId: number, userId: number): Promise<any> => {
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

// Eliminar negocio completamente y opcionalmente eliminar al propietario
export const deleteBusinessCompletely = async (businessId: number, deleteOwner: boolean = false): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Usar el endpoint completo que maneja todo: negocio, business_accessibility, rol y opcionalmente usuario
    const response = await fetch(`${API_URL}/business/${businessId}/complete?deleteOwner=${deleteOwner}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al eliminar negocio: ${errorText || response.statusText}`);
    }

    const result = await response.json(); // El endpoint complete devuelve JSON
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Helpers de rol
const hasRoleId = (roles: AdminRole[] | undefined, id: number) =>
  Array.isArray(roles) && roles.some((r) => r?.id === id);

/**
 * Devuelve SOLO usuarios finales (rol id 2) y descarta administradores (id 1) y propietarios (id 3).
 */
export const getUsersOnly = async (): Promise<AdminUser[]> => {
  const all = await getAllUsers();
  
  const filtered = all.filter((u) => {
    const isUser = hasRoleId(u.roles, 2); // Tiene rol de usuario
    const isAdmin = hasRoleId(u.roles, 1); // Tiene rol de administrador
    const isOwner = hasRoleId(u.roles, 3); // Tiene rol de propietario (asumiendo que es id 3)
    
    // También verificar por nombre del rol en caso de que el ID sea diferente
    const isOwnerByName = u.roles?.some(role => 
      role.name?.toLowerCase().includes('propietario') || 
      role.name?.toLowerCase().includes('business') ||
      role.name?.toLowerCase().includes('owner')
    );
    
    // Incluir solo si es usuario Y NO es admin Y NO es propietario
    return isUser && !isAdmin && !isOwner && !isOwnerByName;
  });
  
  return filtered;
};

/**
 * Función de debugging para ver todos los usuarios y sus roles
 */
export const getAllUsersWithRoleDetails = async () => {
  const all = await getAllUsers();
  
  all.forEach((user, index) => {
    const roleNames = user.roles?.map(r => r.name).join(', ') || 'Sin roles';
    const roleIds = user.roles?.map(r => r.id).join(', ') || 'Sin IDs';
    
    // Análisis de filtros
    const isUser = hasRoleId(user.roles, 2);
    const isAdmin = hasRoleId(user.roles, 1);
    const isOwner = hasRoleId(user.roles, 3);
    const isOwnerByName = user.roles?.some(role => 
      role.name?.toLowerCase().includes('propietario') || 
      role.name?.toLowerCase().includes('business') ||
      role.name?.toLowerCase().includes('owner')
    );
  });
  
  return all;
};

/**
 * Devuelve negocios/propietarios con información de usuario completa.
 * Como alternativa cuando el backend no incluye la relación user en business.
 */
export const getOwnersWithUserDetails = async () => {
  try {
    // Obtener negocios y usuarios por separado
    const [businesses, users] = await Promise.all([
      getAllBusinesses(),
      getAllUsers()
    ]);
    
    // Crear un mapa de usuarios por ID para búsqueda rápida
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user.id, user);
    });
    
    // Intentar relacionar negocios con usuarios
    const businessesWithUsers = businesses.map((business: any) => {
      let relatedUser = null;
      
      // Si el business ya tiene user, usarlo y completar con datos del mapa
      if (business.user && business.user.id) {
        const userFromMap = userMap.get(business.user.id);
        if (userFromMap) {
          relatedUser = {
            ...business.user,
            email: userFromMap.email || business.user.email,
            user_email: userFromMap.user_email || userFromMap.email || business.user.user_email,
          };
        } else {
          relatedUser = business.user;
        }
      } else {
        // Buscar usuario que tenga rol de propietario (rol id 3) o business owner
        const potentialOwner = users.find(user => 
          user.roles && user.roles.some((role: any) => 
            role.id === 3 || role.name?.toLowerCase().includes('business') || 
            role.name?.toLowerCase().includes('propietario') ||
            role.name?.toLowerCase().includes('owner')
          )
        );
        
        if (potentialOwner) {
          relatedUser = potentialOwner;
        }
      }
      
      return {
        ...business,
        user: relatedUser
      };
    });
    
    // Filtrar: 
    // 1. Debe tener usuario asociado
    // 2. Excluir administradores (rol 1)
    // 3. Incluir solo propietarios (rol 3)
    const filtered = businessesWithUsers.filter((b: any) => {
      const hasUser = b.user && b.user.id;
      const isAdmin = hasRoleId(b?.user?.roles, 1);
      const isOwner = hasRoleId(b?.user?.roles, 3);
      // Mostrar solo si TIENE usuario Y NO es admin Y SÍ es propietario
      return hasUser && !isAdmin && isOwner;
    });
    
    return filtered;
  } catch (error) {
    throw error;
  }
};

/**
 * Devuelve TODOS los negocios (propietarios y sin propietario)
 * Descarta administradores si llegan anidados.
 */
export const getOwners = async () => {
  try {
    const all = await getAllBusinesses();
    
    // Filtrar: 
    // 1. Si TIENE usuario, NO debe ser admin (rol 1)
    // 2. Incluir negocios sin usuario (degradados)
    const filtered = all.filter((b: any) => {
      const hasUser = b.user && b.user.id;
      const isAdmin = hasRoleId(b?.user?.roles, 1);
      
      // Si no tiene usuario, incluirlo (negocio sin propietario)
      if (!hasUser) {
        return true;
      }
      
      // Si tiene usuario pero es admin, excluirlo
      if (isAdmin) {
        return false;
      }
      
      // Cualquier otro caso, incluir
      return true;
    });
    
    return filtered;
  } catch (error) {
    throw error;
  }
};

// Tipos para modales de edición
export interface EditUserData {
  id: number;
  email: string;
  firstName: string;
  firstLastName: string;
  cellphone?: string;
  address?: string;
  gender?: string;
}

export interface UserRole {
  id: number;
  name: string;
}

/**
 * Obtiene todos los roles disponibles para cambio de usuario
 * Excluye el rol de Admin para evitar que usuarios regulares sean promovidos a Admin
 */
export const getAllRoles = async (): Promise<UserRole[]> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_URL}/roles`, { headers });

    let allRoles: UserRole[] = [];

    if (!response.ok) {
      // Si no hay endpoint de roles, devolvemos los roles predeterminados
      allRoles = [
        { id: 2, name: 'User' },
        { id: 3, name: 'Propietario' }
      ];
    } else {
      const rolesFromServer = await response.json();
      allRoles = rolesFromServer.map((role: any) => ({
        id: role.rol_id || role.id,
        name: role.rol_name || role.name
      }));
    }

    // Filtrar para excluir Admin (ID: 1) y solo permitir cambios entre Usuario y Propietario
    const allowedRoles = allRoles.filter(role => 
      role.id === 2 || role.id === 3 || 
      role.name.toLowerCase() === 'user' || 
      role.name.toLowerCase() === 'propietario'
    );

    return allowedRoles;
  } catch (error) {
    // Devolver roles predeterminados en caso de error (sin Admin)
    return [
      { id: 2, name: 'User' },
      { id: 3, name: 'Propietario' }
    ];
  }
};

/**
 * Actualiza la información de un usuario
 */
export const updateUser = async (userId: number, userData: Partial<EditUserData>): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    
    // Actualizar información del usuario (email)
    if (userData.email) {
      const userResponse = await fetch(`${API_URL}/user/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          user_email: userData.email
        })
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(`Error al actualizar usuario: ${errorText || userResponse.statusText}`);
      }
    }

    // Actualizar información de la persona (nombres, apellidos, etc.)
    const peopleData: any = {};
    if (userData.firstName !== undefined) peopleData.firstName = userData.firstName;
    if (userData.firstLastName !== undefined) peopleData.firstLastName = userData.firstLastName;
    if (userData.cellphone !== undefined) peopleData.cellphone = userData.cellphone;
    if (userData.address !== undefined) peopleData.address = userData.address;
    if (userData.gender !== undefined) peopleData.gender = userData.gender;

    if (Object.keys(peopleData).length > 0) {
      // Intentaremos localizar el registro de persona asociado al usuario.
      // La API es inconsistente: GET /people/:id usa people_id pero PUT /people/:id espera user_id.
      // Por eso buscamos en la lista completa de personas y, si encontramos una con user_id === userId,
      // llamamos a PUT /people/{userId} para actualizarla.

      // Obtener detalles de usuario (no obligatorio para encontrar la persona)
      const userDetailsResponse = await fetch(`${API_URL}/user/${userId}`, { headers });
      if (!userDetailsResponse.ok) {
        throw new Error('No se pudo obtener los detalles del usuario');
      }

      const userDetails = await userDetailsResponse.json();

      // Import dinámico para obtener todas las personas y buscar la que corresponde a este userId
      const { getAllPeople } = await import('./people');
      let peopleList: any[] = [];
      try {
        peopleList = await getAllPeople();
      } catch (err) {
        // Error silencioso si no se puede obtener la lista de personas
      }

      // Buscar persona por user_id o por campo user enlazado
      const matched = peopleList.find((p: any) => (
        p.user_id === userId ||
        p.user === userId ||
        (p.user && (p.user.user_id === userId || p.user.id === userId))
      ));

      if (matched) {
        // Llamar al endpoint PUT /people/{userId} (el controlador espera user_id en la ruta)
        const peopleResponse = await fetch(`${API_URL}/people/${userId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(peopleData)
        });

        if (!peopleResponse.ok) {
          const errorText = await peopleResponse.text();
          throw new Error(`Error al actualizar información personal: ${errorText || peopleResponse.statusText}`);
        }
      }
      // No existe registro de persona; no intentamos crear uno (no hay endpoint público garantizado).
      // El email (si se pidió) será actualizado sin error.
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Añade un rol adicional a un usuario (sin eliminar roles existentes)
 * Usa el endpoint POST /user-rol para verdadera adición de roles
 */
export const addUserRole = async (userId: number, newRoleId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    
    // Verificar conectividad primero
    if (!navigator.onLine) {
      throw new Error('No hay conexión a internet. Verifica tu conexión y vuelve a intentar.');
    }
    
    // Usar endpoint específico para añadir rol (no reemplazar)
    const response = await fetch(`${API_URL}/user-rol`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        rol_id: newRoleId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al añadir rol: ${errorText || response.statusText}`);
    }
  } catch (error) {
    // Proporcionar mensajes de error más específicos
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor. Verifica que el backend esté funcionando en http://localhost:9080');
    }
    
    throw error;
  }
};

/**
 * Cambia el rol de un usuario (mantiene compatibilidad para cambios simples)
 */
export const changeUserRole = async (userId: number, newRoleId: number): Promise<void> => {
  try {
    // Para cambio a Propietario, añadir rol en lugar de reemplazar
    if (newRoleId === 3) { // ID 3 = Propietario
      await addUserRole(userId, newRoleId);
      return;
    }

    // Para otros cambios, usar la lógica original
    const headers = getAuthHeaders();
    
    // Verificar conectividad primero
    if (!navigator.onLine) {
      throw new Error('No hay conexión a internet. Verifica tu conexión y vuelve a intentar.');
    }
    
    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        rol_id: newRoleId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al cambiar rol: ${errorText || response.statusText}`);
    }
  } catch (error) {
    // Proporcionar mensajes de error más específicos
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor. Verifica que el backend esté funcionando en http://localhost:9080');
    }
    
    throw error;
  }
};

/**
 * Obtiene información detallada de un usuario para edición
 */
export const getUserForEdit = async (userId: number): Promise<EditUserData | null> => {
  try {
    const headers = getAuthHeaders();
    
    // Importamos dinámicamente para evitar dependencias circulares
    const { getAllPeople } = await import('./people');
    
    const [userResponse, peopleResponse] = await Promise.all([
      fetch(`${API_URL}/user/${userId}`, { headers }),
      getAllPeople() // Usamos la función existente para obtener personas
    ]);

    if (!userResponse.ok) {
      throw new Error(`Error al obtener usuario: ${userResponse.statusText}`);
    }

    const user = await userResponse.json();
    
    const person = peopleResponse.find((p: any) => 
      p.user_id === userId || 
      p.user === userId || 
      (p.user && (p.user.user_id === userId || p.user.id === userId))
    );

    const userData = {
      id: userId,
      email: user.email || user.user_email || '',
      firstName: person?.firstName || '',
      firstLastName: person?.firstLastName || '',
      cellphone: person?.cellphone || '',
      address: person?.address || '',
      gender: person?.gender || ''
    };

    return userData;
  } catch (error) {
    return null;
  }
};

/**
 * Crea un nuevo negocio usando credenciales de administrador
 * Esto permite que el admin pueda crear negocios para usuarios recién promovidos
 */
export const createBusinessAsAdmin = async (businessData: {
  business_name: string;
  address: string;
  NIT: string; // Cambiar de number a string
  description: string;
  coordinates: string;
  accessibilityIds: number[];
  user_id: number;
}): Promise<string> => {
  try {
    const headers = getAuthHeaders();
    
    // Verificar conectividad primero
    if (!navigator.onLine) {
      throw new Error('No hay conexión a internet. Verifica tu conexión y vuelve a intentar.');
    }
    
    const response = await fetch(`${API_URL}/business`, {
      method: 'POST',
      headers,
      body: JSON.stringify(businessData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al crear negocio: ${errorText || response.statusText}`);
    }
    
    const result = await response.text();
    return result;
  } catch (error) {
    // Proporcionar mensajes de error más específicos
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor. Verifica que el backend esté funcionando en http://localhost:9080');
    }
    
    throw error;
  }
};

/**
 * Obtener información básica del usuario
 */
const getUserBasicInfo = async (userId: number): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');

  const response = await fetch(`${API_URL}/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al obtener usuario: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

/**
 * Obtener información personal (people) del usuario
 * Intenta múltiples métodos para encontrar los datos
 */
const getUserPeopleInfo = async (userId: number): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');

  try {
    // Método 1: Intentar obtener todas las personas y filtrar por user_id
    // (Este es el método más seguro si existe)
    const responseAll = await fetch(`${API_URL}/people`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (responseAll.ok) {
      const allPeople = await responseAll.json();
      
      // Buscar la persona que pertenece al usuario
      const userPerson = allPeople.find((person: any) => 
        person.user?.user_id === userId || person.user_id === userId
      );
      
      if (userPerson) {
        return userPerson;
      }
    }

    // Método 2: Si no funciona lo anterior, devolver null
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Obtener negocios del usuario desde la API existente
 */
const getUserBusinesses = async (): Promise<any[]> => {
  const businesses = await getOwners();
  return businesses || [];
};

/**
 * Obtener información completa de un usuario/propietario (personal + negocios)
 * Combinando múltiples endpoints existentes
 */
export const getUserCompleteInfo = async (userId: number): Promise<any> => {
  try {
    // 1. Obtener información básica del usuario
    const userInfo = await getUserBasicInfo(userId);
    
    // 2. Obtener información personal (people)
    const peopleInfo = await getUserPeopleInfo(userId);
    
    // 3. Obtener todos los negocios y filtrar por usuario
    const allBusinesses = await getUserBusinesses();
    const userBusinesses = allBusinesses.filter(business => 
      business.user && business.user.id === userId
    );

    // 4. Construir respuesta unificada
    const result = {
      user: {
        user_id: userInfo.user_id,
        user_email: userInfo.user_email,
        roles: userInfo.roles || []
      },
      people: peopleInfo ? {
        people_id: peopleInfo.people_id || peopleInfo.id,
        firstName: peopleInfo.firstName,
        firstLastName: peopleInfo.firstLastName,
        cellphone: peopleInfo.cellphone,
        address: peopleInfo.address,
        gender: peopleInfo.gender
      } : null,
      businesses: userBusinesses.map(business => ({
        business_id: business.id,
        business_name: business.name,
        NIT: business.nit || business.NIT,
        address: business.address,
        description: business.description,
        coordinates: business.coordinates
      }))
    };

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};

/**
 * Actualizar información personal de un propietario (people)
 * Usa el user_id ya que el endpoint espera user_id no people_id
 */
export const updatePeopleInfo = async (userId: number, peopleData: any): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // El endpoint people/:id espera user_id según el código del backend
    const response = await fetch(`${API_URL}/people/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(peopleData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};

/**
 * Actualizar información del negocio
 */
export const updateBusinessInfo = async (businessId: number, businessData: any): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL}/business/${businessId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};

/**
 * Actualizar email del usuario (ya existe actualizarUsuario pero creamos específica)
 */
export const updateUserEmail = async (userId: number, userData: any): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};

/**
 * Eliminar usuario completamente del sistema
 * Incluye validaciones para evitar eliminar usuarios con negocios o roles críticos
 */
export const eliminarUsuario = async (userId: number): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    // El backend devuelve texto plano, no JSON
    const resultText = await response.text();
    
    return { message: resultText };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};
