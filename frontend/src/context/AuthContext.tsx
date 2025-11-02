import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../config/api';

interface User {
  user_id?: number;
  name?: string;
  email?: string;
  rol_name?: string;
  rolIds?: number[];
  avatar?: string;
}

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

  const applyUserFromToken = (token: string): boolean => {
    const decoded = parseJwt(token);
    if (!decoded) return false;
    setUser({
      user_id: decoded.user_id || decoded.user_id,
      name: `${decoded.firstName || ''} ${decoded.firstLastName || ''}`.trim() || undefined,
      email: decoded.user_email || decoded.email,
      rolIds: decoded.rolIds || (decoded.rol_id ? [decoded.rol_id] : []),
    });
    setIsAuthenticated(true);
    return true;
  };

  const fetchUserFromServer = async (token: string) => {
    try {
      console.log('Fetching /user/profile with token');
      const resp = await fetch(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        console.log('Fetch /user/profile not ok:', resp.status);
        // If unauthorized or forbidden -> remove token and clear
        if (resp.status === 401 || resp.status === 403) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
        // For server errors (5xx) or other statuses, fallback to parsing token locally
        const applied = applyUserFromToken(token);
        if (applied) return true;
        // if parsing fails, clear token
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }

      const data = await resp.json();
      // data: { user_id, user_email, firstName, firstLastName, rolIds, business_id, business_name }
      setUser({
        user_id: data.user_id,
        name: `${data.firstName || ''} ${data.firstLastName || ''}`.trim() || undefined,
        email: data.user_email,
        rolIds: data.rolIds || [],
        avatar: data.avatar,
      });
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Error fetching user from server:', err);
      // Network or unexpected error: try fallback to token parse
      const tokenApplied = applyUserFromToken(token);
      if (tokenApplied) return true;
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

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