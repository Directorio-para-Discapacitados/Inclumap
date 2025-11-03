// frontend/src/pages/ajustes/Ajustes.tsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminRolePanel from '../../Components/AdminRolePanel/AdminRolePanel';
import UserSettings from '../../Components/UserSettings/UserSettings';
import './Ajustes.css';

const AjustesPage = () => {
  const { user } = useAuth();

  // 1. VALIDACIÓN DE ROL
  // Revisa el rol del usuario que viene del AuthContext.
  // Tu Navbar usa 'roleDescription', así que lo usamos aquí también.
  const isAdmin = user?.roleDescription === 'Administrador';

  return (
    <div className="ajustes-container">
      {isAdmin ? (
        // Si es Admin, muestra el Panel de Gestión de Roles
        <AdminRolePanel />
      ) : (
        // Si es Usuario o Propietario, muestra los ajustes normales
        <UserSettings />
      )}
    </div>
  );
};

export default AjustesPage;