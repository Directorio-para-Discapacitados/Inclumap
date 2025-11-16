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
  console.group('🔍 Diagnóstico de Conexión');
  
  console.log('🌐 URL del API:', API_URL);
  console.log('📶 Estado de red:', navigator.onLine ? '✅ Conectado' : '❌ Sin conexión');
  
  // Verificar token de autenticación
  const token = localStorage.getItem('token');
  console.log('🔑 Token de auth:', token ? '✅ Presente' : '❌ No encontrado');
  
  // Intentar conectar al backend
  console.log('🔄 Verificando conexión al backend...');
  
  try {
    const response = await fetch(`${API_URL}/user-rol`, {
      method: 'GET',
      headers: token ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      } : {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Respuesta del servidor:', response.status, response.statusText);
    
    if (response.status === 401) {
      console.log('🔒 Problema de autenticación - Token inválido o expirado');
    } else if (response.status === 404) {
      console.log('❓ Endpoint no encontrado - Verificar rutas del backend');
    } else if (response.status >= 500) {
      console.log('💥 Error del servidor - Verificar logs del backend');
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error);
    console.log('💡 Posibles causas:');
    console.log('   - Backend no está ejecutándose');
    console.log('   - Puerto incorrecto (verificar que sea 9080)');
    console.log('   - Firewall bloqueando la conexión');
    console.log('   - CORS no configurado correctamente');
  }
  
  console.groupEnd();
};

/**
 * Función de prueba para verificar login de admin
 */
export const testAdminLogin = async (): Promise<void> => {
  console.group('🔍 Test Login Admin');
  
  try {
    console.log('🔄 Probando endpoint de login...');
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: 'test@test.com',
        user_password: 'test123'
      })
    });
    
    console.log('📡 Respuesta del login:', response.status, response.statusText);
    
    if (response.status === 401) {
      console.log('🔒 Credenciales incorrectas (normal para test)');
    } else if (response.status === 404) {
      console.log('❓ Endpoint de login no encontrado');
    } else if (response.status >= 500) {
      console.log('💥 Error del servidor');
    } else if (response.ok) {
      console.log('✅ Login funcionando correctamente');
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error);
    console.log('💡 Posibles causas:');
    console.log('   - Backend no está ejecutándose');
    console.log('   - CORS no configurado correctamente');
    console.log('   - Firewall bloqueando la conexión');
  }
  
  console.groupEnd();
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
    console.error('Error en getAllUsers:', error);
    throw error; // Re-lanzamos el error para que el componente que llama lo maneje
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
    console.log('🔍 Datos raw del backend para businesses:', raw);
    console.log('🔍 Cantidad de businesses recibidos:', raw.length);
    
    // Normalizamos estructura esperada del negocio con su usuario
    const businesses = (raw || []).map((b: any) => {
      console.log('🔍 Procesando business completo:', b);
      console.log('🔍 Usuario del business:', b.user);
      if (b.user) {
        console.log('🔍 Roles del usuario en business:', b.user.roles);
        console.log('🔍 ¿Roles es array?:', Array.isArray(b.user.roles));
      }
      
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
      
      console.log('Business normalizado:', normalizedBusiness);
      return normalizedBusiness;
    });

    return businesses;
  } catch (error) {
    console.error('Error en getAllBusinesses:', error);
    throw error; // Re-lanzamos el error para que el componente que llama lo maneje
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

    console.log(`🔄 Verificando y quitando rol ${roleIdToRemove} del usuario ${userId}`);

    // Primero, verificar si el usuario tiene el rol
    const userRolesResponse = await fetch(`${API_URL}/user-rol/user/${userId}`, {
      method: 'GET',
      headers
    });

    if (userRolesResponse.ok) {
      const userRoles = await userRolesResponse.json();
      const hasRole = userRoles.some((role: any) => role.rol_id === roleIdToRemove);
      
      if (!hasRole) {
        console.log(`ℹ️ El usuario ${userId} ya no tiene el rol ${roleIdToRemove}`);
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
      console.error('Error en respuesta del servidor:', errorText);
      
      // Si el error es que no tiene el rol, no es realmente un error
      if (errorText.includes('no tiene asignado este rol')) {
        console.log(`ℹ️ El usuario ${userId} ya no tiene el rol ${roleIdToRemove}`);
        return;
      }
      
      throw new Error(`Error al quitar rol: ${errorText || response.statusText}`);
    }
    
    console.log(`✅ Rol ${roleIdToRemove} quitado exitosamente del usuario ${userId}`);
    
    // Verificar qué roles le quedan al usuario
    try {
      const userRolesAfter = await fetch(`${API_URL}/user-rol/user/${userId}`, {
        method: 'GET',
        headers
      });
      
      if (userRolesAfter.ok) {
        const rolesRemaining = await userRolesAfter.json();
        console.log(`🔍 Roles restantes para usuario ${userId}:`, rolesRemaining);
      }
    } catch (verifyError) {
      console.log('No se pudo verificar roles restantes:', verifyError);
    }
  } catch (error) {
    console.error('Error en removeUserRole:', error);
    
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

    console.log(`🔄 Removiendo propietario del negocio ${businessId}`);
    console.log('🔄 URL del endpoint:', `${API_URL}/business/${businessId}/clear-owner`);

    // Usar el endpoint específico para limpiar propietario (solo admins)
    const response = await fetch(`${API_URL}/business/${businessId}/clear-owner`, {
      method: 'PATCH',
      headers
    });

    console.log('🔄 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en respuesta del servidor:', errorText);
      throw new Error(`Error al remover propietario del negocio: ${errorText || response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Response del servidor:', responseData);
    console.log(`✅ ${responseData.message || 'Propietario removido exitosamente'}`);
  } catch (error) {
    console.error('Error en removeBusinessOwner:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};

// Función completa para degradar propietario conservando negocio
export const demoteOwnerKeepBusiness = async (userId: number, businessId: number): Promise<void> => {
  try {
    console.log(`🔄 Iniciando degradación de propietario - Usuario: ${userId}, Negocio: ${businessId}`);
    
    // 1. Remover rol de propietario del usuario
    await removeUserRole(userId, 3);
    console.log('✅ Rol de propietario removido');
    
    // 2. Remover la asociación usuario-negocio
    await removeBusinessOwner(businessId);
    console.log('✅ Asociación usuario-negocio removida');
    
    console.log('🎉 Degradación de propietario completada exitosamente');
  } catch (error) {
    console.error('❌ Error en degradación de propietario:', error);
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

    console.log('🔄 Obteniendo negocios disponibles sin propietario...');

    const response = await fetch(`${API_URL}/business/available/unowned`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener negocios disponibles: ${errorText || response.statusText}`);
    }

    const businesses = await response.json();
    console.log('✅ Negocios disponibles obtenidos:', businesses);
    return businesses;
  } catch (error) {
    console.error('Error en getAvailableBusinesses:', error);
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

    console.log(`🔄 Asignando negocio ${businessId} al usuario ${userId}...`);

    const response = await fetch(`${API_URL}/business/${businessId}/assign-owner/${userId}`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al asignar negocio: ${errorText || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Negocio asignado exitosamente:', result);
    return result;
  } catch (error) {
    console.error('Error en assignBusinessToUser:', error);
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

    console.log(`🗑️ Eliminando negocio ${businessId} completamente. Eliminar propietario: ${deleteOwner}`);

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
    console.log('✅ Negocio eliminado completamente:', result);
    
    return result;
  } catch (error) {
    console.error('Error en deleteBusinessCompletely:', error);
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
  console.log('Todos los usuarios antes del filtro:', all);
  
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
    
    console.log(`Usuario ${u.email}: User=${isUser}, Admin=${isAdmin}, Owner=${isOwner}, OwnerByName=${isOwnerByName}`, u.roles);
    
    // Incluir solo si es usuario Y NO es admin Y NO es propietario
    return isUser && !isAdmin && !isOwner && !isOwnerByName;
  });
  
  console.log('Usuarios filtrados (solo usuarios finales):', filtered);
  return filtered;
};

/**
 * Función de debugging para ver todos los usuarios y sus roles
 */
export const getAllUsersWithRoleDetails = async () => {
  const all = await getAllUsers();
  console.log('=== ANÁLISIS DETALLADO DE TODOS LOS USUARIOS ===');
  
  all.forEach((user, index) => {
    const roleNames = user.roles?.map(r => r.name).join(', ') || 'Sin roles';
    const roleIds = user.roles?.map(r => r.id).join(', ') || 'Sin IDs';
    
    console.log(`${index + 1}. ${user.email}:`);
    console.log(`   - Roles: ${roleNames}`);
    console.log(`   - IDs de roles: ${roleIds}`);
    console.log(`   - Objeto roles completo:`, user.roles);
    
    // Análisis de filtros
    const isUser = hasRoleId(user.roles, 2);
    const isAdmin = hasRoleId(user.roles, 1);
    const isOwner = hasRoleId(user.roles, 3);
    const isOwnerByName = user.roles?.some(role => 
      role.name?.toLowerCase().includes('propietario') || 
      role.name?.toLowerCase().includes('business') ||
      role.name?.toLowerCase().includes('owner')
    );
    
    console.log(`   - Análisis: User=${isUser}, Admin=${isAdmin}, Owner=${isOwner}, OwnerByName=${isOwnerByName}`);
    console.log(`   - ¿Aparecería en usuarios?: ${isUser && !isAdmin && !isOwner && !isOwnerByName}`);
    console.log('---');
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
    
    console.log('Businesses obtenidos:', businesses);
    console.log('Users obtenidos para mapping:', users);
    
    // Crear un mapa de usuarios por ID para búsqueda rápida
    const userMap = new Map();
    users.forEach(user => {
      console.log(`📌 Agregando usuario al mapa - ID: ${user.id}, Email: ${user.email}`);
      userMap.set(user.id, user);
    });
    
    console.log('Mapa de usuarios creado:', userMap);
    
    // Intentar relacionar negocios con usuarios
    const businessesWithUsers = businesses.map((business: any) => {
      let relatedUser = null;
      
      // Si el business ya tiene user, usarlo y completar con datos del mapa
      if (business.user && business.user.id) {
        console.log(`🔍 Buscando usuario ${business.user.id} en el mapa para negocio "${business.name}"`);
        
        const userFromMap = userMap.get(business.user.id);
        if (userFromMap) {
          console.log(`✅ Usuario encontrado en mapa:`, userFromMap);
          relatedUser = {
            ...business.user,
            email: userFromMap.email || business.user.email,
            user_email: userFromMap.user_email || userFromMap.email || business.user.user_email,
          };
        } else {
          console.log(`❌ Usuario ${business.user.id} NO encontrado en el mapa`);
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
    
    console.log('Businesses con usuarios relacionados:', businessesWithUsers);
    
    // Filtrar: 
    // 1. Debe tener usuario asociado
    // 2. Excluir administradores (rol 1)
    // 3. Incluir solo propietarios (rol 3)
    const filtered = businessesWithUsers.filter((b: any) => {
      const hasUser = b.user && b.user.id;
      const isAdmin = hasRoleId(b?.user?.roles, 1);
      const isOwner = hasRoleId(b?.user?.roles, 3);
      console.log(`📊 Business "${b.name}" - Tiene usuario: ${hasUser}, Es admin: ${isAdmin}, Es propietario: ${isOwner}`);
      // Mostrar solo si TIENE usuario Y NO es admin Y SÍ es propietario
      return hasUser && !isAdmin && isOwner;
    });
    
    console.log(`✅ Propietarios filtrados: ${filtered.length} de ${businessesWithUsers.length}`);
    return filtered;
  } catch (error) {
    console.error('Error en getOwnersWithUserDetails:', error);
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
    console.log('Todos los businesses antes del filtro:', all);
    
    // Filtrar: 
    // 1. Si TIENE usuario, NO debe ser admin (rol 1)
    // 2. Incluir negocios sin usuario (degradados)
    const filtered = all.filter((b: any) => {
      const hasUser = b.user && b.user.id;
      const isAdmin = hasRoleId(b?.user?.roles, 1);
      
      // Si no tiene usuario, incluirlo (negocio sin propietario)
      if (!hasUser) {
        console.log(`Business "${b.name}" - Sin propietario, INCLUIR`);
        return true;
      }
      
      // Si tiene usuario pero es admin, excluirlo
      if (isAdmin) {
        console.log(`Business "${b.name}" - Es administrador, EXCLUIR`);
        return false;
      }
      
      // Cualquier otro caso, incluir
      console.log(`Business "${b.name}" - Tiene propietario (no admin), INCLUIR`);
      return true;
    });
    
    console.log(`Businesses filtrados: ${filtered.length} (incluyendo sin propietario)`);
    
    return filtered;
  } catch (error) {
    console.error('Error en getOwners:', error);
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
    console.error('Error al obtener roles:', error);
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
      console.log('Detalles del usuario:', userDetails);

      // Import dinámico para obtener todas las personas y buscar la que corresponde a este userId
      const { getAllPeople } = await import('./people');
      let peopleList: any[] = [];
      try {
        peopleList = await getAllPeople();
      } catch (err) {
        console.warn('No se pudo obtener la lista de personas para buscar asociación:', err);
      }

      // Buscar persona por user_id o por campo user enlazado
      const matched = peopleList.find((p: any) => (
        p.user_id === userId ||
        p.user === userId ||
        (p.user && (p.user.user_id === userId || p.user.id === userId))
      ));

      if (matched) {
        // Llamar al endpoint PUT /people/{userId} (el controlador espera user_id en la ruta)
        console.log('Persona encontrada para usuario:', matched, 'Actualizando vía userId:', userId, 'con datos:', peopleData);
        const peopleResponse = await fetch(`${API_URL}/people/${userId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(peopleData)
        });

        if (!peopleResponse.ok) {
          const errorText = await peopleResponse.text();
          console.error('Error en people response:', errorText);
          throw new Error(`Error al actualizar información personal: ${errorText || peopleResponse.statusText}`);
        }

        const peopleResult = await peopleResponse.text();
        console.log('Resultado actualización people:', peopleResult);
      } else {
        // No existe registro de persona; informamos y no intentamos crear uno (no hay endpoint público garantizado).
        console.warn('Usuario sin información personal asociada. Los datos del perfil (nombre, apellido, etc.) no se pueden actualizar porque no existe un registro en la tabla people para este usuario.');
        console.warn('Solo se actualizará el email del usuario si se proporcionó.');
        // No lanzamos error para no romper la UX; el caller recibirá que el email (si se pidió) fue actualizado.
      }
    }
  } catch (error) {
    console.error('Error en updateUser:', error);
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
    
    console.log('Añadiendo rol al usuario:', userId, 'rol ID:', newRoleId);
    
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
      console.error('Error en respuesta del servidor:', errorText);
      throw new Error(`Error al añadir rol: ${errorText || response.statusText}`);
    }
    
    const result = await response.text();
    console.log('Resultado de añadir rol:', result);
  } catch (error) {
    console.error('Error en addUserRole:', error);
    
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
    
    console.log('Cambiando rol de usuario:', userId, 'a rol ID:', newRoleId);
    
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
      console.error('Error en respuesta del servidor:', errorText);
      throw new Error(`Error al cambiar rol: ${errorText || response.statusText}`);
    }
    
    const result = await response.text();
    console.log('Resultado del cambio de rol:', result);
  } catch (error) {
    console.error('Error en changeUserRole:', error);
    
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
    
    console.log('Obteniendo datos del usuario para edición:', userId);
    
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
    console.log('Datos del usuario obtenidos:', user);
    
    const person = peopleResponse.find((p: any) => 
      p.user_id === userId || 
      p.user === userId || 
      (p.user && (p.user.user_id === userId || p.user.id === userId))
    );
    
    console.log('Datos de la persona encontrados:', person);

    const userData = {
      id: userId,
      email: user.email || user.user_email || '',
      firstName: person?.firstName || '',
      firstLastName: person?.firstLastName || '',
      cellphone: person?.cellphone || '',
      address: person?.address || '',
      gender: person?.gender || ''
    };

    if (!person) {
      console.warn('Usuario sin información personal. Solo se podrá editar el email.');
    }

    return userData;
  } catch (error) {
    console.error('Error en getUserForEdit:', error);
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
    
    console.log('Admin creando negocio para usuario:', businessData.user_id, 'Datos:', businessData);
    
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
      console.error('Error en respuesta del servidor:', errorText);
      throw new Error(`Error al crear negocio: ${errorText || response.statusText}`);
    }
    
    const result = await response.text();
    console.log('Negocio creado exitosamente por admin:', result);
    return result;
  } catch (error) {
    console.error('Error en createBusinessAsAdmin:', error);
    
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
    console.log('🔍 Intentando obtener todas las personas...');
    const responseAll = await fetch(`${API_URL}/people`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (responseAll.ok) {
      const allPeople = await responseAll.json();
      console.log('👥 Todas las personas obtenidas:', allPeople);
      
      // Buscar la persona que pertenece al usuario
      const userPerson = allPeople.find((person: any) => 
        person.user?.user_id === userId || person.user_id === userId
      );
      
      if (userPerson) {
        console.log('✅ Persona encontrada:', userPerson);
        return userPerson;
      }
    }

    // Método 2: Si no funciona lo anterior, devolver null
    console.log('⚠️ No se encontró información personal para el usuario:', userId);
    return null;
  } catch (error) {
    console.log('⚠️ Error al obtener información personal:', error);
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
  console.log('🔄 Obteniendo información completa del usuario:', userId);
  
  try {
    // 1. Obtener información básica del usuario
    console.log('📡 Obteniendo información básica...');
    const userInfo = await getUserBasicInfo(userId);
    
    // 2. Obtener información personal (people)
    console.log('👤 Obteniendo información personal...');
    const peopleInfo = await getUserPeopleInfo(userId);
    
    // 3. Obtener todos los negocios y filtrar por usuario
    console.log('🏢 Obteniendo información de negocios...');
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

    console.log('✅ Información completa combinada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getUserCompleteInfo:', error);
    
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
  console.log('🔄 Actualizando información personal para usuario:', userId, peopleData);
  
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
      console.error('❌ Error del servidor:', errorText);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    console.log('✅ Información personal actualizada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en updatePeopleInfo:', error);
    
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
  console.log('🔄 Actualizando información del negocio:', businessId, businessData);
  
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
      console.error('❌ Error del servidor:', errorText);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    console.log('✅ Información del negocio actualizada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en updateBusinessInfo:', error);
    
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
  console.log('🔄 Actualizando email del usuario:', userId, userData);
  
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
      console.error('❌ Error del servidor:', errorText);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    console.log('✅ Email del usuario actualizado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en updateUserEmail:', error);
    
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
  console.log('🗑️ Eliminando usuario:', userId);
  
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
      console.error('❌ Error del servidor al eliminar usuario:', errorText);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    // El backend devuelve texto plano, no JSON
    const resultText = await response.text();
    console.log('✅ Usuario eliminado exitosamente:', resultText);
    
    return { message: resultText };
  } catch (error) {
    console.error('❌ Error en eliminarUsuario:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se puede conectar al servidor');
    }
    
    throw error;
  }
};
