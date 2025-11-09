// frontend/src/context/AuthContext.tsx (Código Completo)

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../config/api';

// --- CORRECCIÓN INTERFAZ ---
interface User {
  user_id?: number;
  displayName?: string;     // <-- 'name' cambiado por 'displayName'
  roleDescription?: string; // <-- AÑADIDO: para el texto del rol
  email?: string;
  rolIds?: number[];
  avatar?: string;
}
// --- FIN CORRECCIÓN ---

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT:', e);
      return null;
    }
  };

  
  const getRoleDescription = (rolIds: number[]): string | undefined => {
    // La prioridad es Propietario, luego Admin, luego Usuario
    if (rolIds.includes(3)) {
      return "Propietario";
    }
    if (rolIds.includes(1)) {
      return "Administrador";
    }
    if (rolIds.includes(2)) {
      return "Usuario";
    }
    return undefined;
  };

  // Esta función se usa como fallback si el servidor no responde
  const applyUserFromToken = (token: string): boolean => {
    const decoded = parseJwt(token);
    if (!decoded) return false;

    const rolIds: number[] = decoded.rolIds || (decoded.rol_id ? [decoded.rol_id] : []);
    let mainName: string | undefined;
    let roleDesc: string | undefined;

    // Si tiene rol 3 (Propietario) Y existe 'business_name', usarlo
    if (rolIds.includes(3) && decoded.business_name) {
      mainName = decoded.business_name;
      roleDesc = "Propietario";
    } else {
      // Si no, construir nombre + rol
      mainName = `${decoded.firstName || ''} ${decoded.firstLastName || ''}`.trim() || undefined;
      roleDesc = getRoleDescription(rolIds);
    }

    setUser({
      user_id: decoded.user_id,
      displayName: mainName,
      roleDescription: roleDesc,
      email: decoded.user_email || decoded.email,
      rolIds: rolIds,
      avatar: decoded.avatar, // Asumiendo que el avatar puede estar en el token
    });
    setIsAuthenticated(true);
    return true;
  };


  // Esta es la función principal que trae datos del servidor
  const fetchUserFromServer = async (token: string) => {
    try {
      // CORREGIDO: URL apuntando a /auth/profile
      console.log('Fetching /auth/profile with token');
      const resp = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        console.log('Fetch /auth/profile not ok:', resp.status);
        if (resp.status === 401 || resp.status === 403) {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
        
        // Si el servidor falla (500, etc.), intenta leer el token
        const applied = applyUserFromToken(token);
        if (applied) return true;
        
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }

      const data = await resp.json();
      
      // Usar los datos que vienen directamente del backend
      setUser({
        user_id: data.user_id,
        displayName: data.displayName,
        roleDescription: data.roleDescription,
        email: data.email,
        rolIds: data.rolIds,
        avatar: data.avatar, // ¡IMPORTANTE! Este es el avatar que se actualiza
      });
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Error fetching user from server:', err);
      // Si hay error de red, intenta leer el token
      const tokenApplied = applyUserFromToken(token);
      if (tokenApplied) return true;

      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };
  // --- FIN CORRECCIÓN LÓGICA DE NOMBRES ---


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserFromServer(token);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    await fetchUserFromServer(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchUserFromServer(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}