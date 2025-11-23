import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../config/api';

interface User {
  user_id?: number;
  displayName?: string;
  roleDescription?: string;
  email?: string;
  rolIds?: number[];
  avatar?: string;
  logo_url?: string | null;
  verified?: boolean;
  business_id?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; 
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateToken: (newToken: string) => void;
  refreshToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);


  const parseJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

  const getRoleDescription = (rolIds: number[]): string | undefined => {
    if (rolIds.includes(3)) return "Propietario";
    if (rolIds.includes(1)) return "Administrador";
    if (rolIds.includes(2)) return "Usuario";
    return undefined;
  };

  const applyUserFromToken = (token: string): boolean => {
    const decoded = parseJwt(token);
    if (!decoded) return false;

    const rolIds: number[] = decoded.rolIds || (decoded.rol_id ? [decoded.rol_id] : []);
    let mainName: string | undefined;
    let roleDesc: string | undefined;

    if (rolIds.includes(3) && decoded.business_name) {
      mainName = decoded.business_name;
      roleDesc = "Propietario";
    } else {
      mainName = `${decoded.firstName || ''} ${decoded.firstLastName || ''}`.trim() || undefined;
      roleDesc = getRoleDescription(rolIds);
    }

    setUser({
      user_id: decoded.user_id,
      displayName: mainName,
      roleDescription: roleDesc,
      email: decoded.user_email || decoded.email,
      rolIds: rolIds,
      avatar: decoded.avatar,
      logo_url: decoded.logo_url || null,
      verified: decoded.verified || false,
      business_id: decoded.business_id || decoded.businessId,
    });
    setIsAuthenticated(true);
    return true;
  };

  const fetchUserFromServer = async (token: string) => {
    try {
      const resp = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
        const applied = applyUserFromToken(token);
        if (applied) return true;
        
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }

      const data = await resp.json();
      setUser({
        user_id: data.user_id,
        displayName: data.displayName,
        roleDescription: data.roleDescription,
        email: data.email,
        rolIds: data.rolIds,
        avatar: data.avatar,
        logo_url: data.logo_url || null,
        verified: data.verified || false,
        business_id: data.business_id || data.businessId,
      });
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      const tokenApplied = applyUserFromToken(token);
      if (tokenApplied) return true;

      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserFromServer(token);
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    setLoading(true); 
    await fetchUserFromServer(token);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchUserFromServer(token);
    }
  };

  const updateToken = (newToken: string) => {
    localStorage.setItem('token', newToken);
    fetchUserFromServer(newToken);
  };

  const refreshToken = async (): Promise<string | null> => {
    // Tu código actual de refreshToken...
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) return null;
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (!response.ok) { logout(); return null; }
      const data = await response.json();
      const newToken = data.access_token || data.token;
      if (newToken) { updateToken(newToken); return newToken; }
      return null;
    } catch (error) {
      console.error('Error al refrescar el token:', error);
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, refreshUser, updateToken, refreshToken }}>
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