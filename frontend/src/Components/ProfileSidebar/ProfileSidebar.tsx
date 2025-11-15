import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfileSidebar.css';

interface ProfileSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface SidebarItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  requiredRole?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'user-profile',
    title: 'Perfil de Usuario',
    icon: '👤',
    description: 'Información personal y configuración básica'
  },
  {
    id: 'owner-profile',
    title: 'Perfil de Propietario',
    icon: '🏪',
    description: 'Gestiona tu negocio y verificación',
    requiredRole: 'Propietario'
  }
];

export default function ProfileSidebar({ activeSection, onSectionChange }: ProfileSidebarProps) {
  const { user } = useAuth();

  const visibleItems = sidebarItems.filter(item => {
    if (item.requiredRole) {
      return user?.roleDescription === item.requiredRole;
    }
    return true;
  });

  return (
    <div className="profile-sidebar">
      <div className="sidebar-header">
        <h2>Configuración</h2>
        <p>Gestiona tu cuenta y preferencias</p>
      </div>
      
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <div className="sidebar-item-icon">
              {item.icon}
            </div>
            <div className="sidebar-item-content">
              <div className="sidebar-item-title">{item.title}</div>
              <div className="sidebar-item-description">{item.description}</div>
            </div>
            <div className="sidebar-item-arrow">
              →
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}