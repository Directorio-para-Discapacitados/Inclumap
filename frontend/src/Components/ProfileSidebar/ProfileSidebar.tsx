import React from 'react';
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
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'user-profile',
    title: 'Perfil de Usuario',
    icon: '👤',
    description: 'Información personal y configuración básica'
  }
];

export default function ProfileSidebar({ activeSection, onSectionChange }: ProfileSidebarProps) {
  return (
    <div className="profile-sidebar">
      <div className="sidebar-header">
        <h2>Configuración</h2>
        <p>Gestiona tu cuenta y preferencias</p>
      </div>
      
      <nav className="sidebar-nav">
        {sidebarItems.map((item) => (
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