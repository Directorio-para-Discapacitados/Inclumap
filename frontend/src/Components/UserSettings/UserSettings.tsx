// frontend/src/Components/UserSettings/UserSettings.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './UserSettings.css';

const UserSettings = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const isAdmin = user?.rolIds?.includes(1);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para llamar a la API de cambiar contraseña
    setMessage('¡Contraseña actualizada con éxito! (Simulación)');
  };

  return (
    <div className="user-settings">
      <h2>Ajustes de la Cuenta</h2>
      <p>Hola, <strong>{user?.displayName}</strong>. Aquí puedes gestionar tu cuenta.</p>
      
      {!isAdmin && (
        <div className="settings-card">
          <h3>Cambiar Contraseña</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Contraseña Actual</label>
              <input type="password" id="currentPassword" required />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <input type="password" id="newPassword" required />
            </div>
            <button type="submit" className="btn-primary">Actualizar Contraseña</button>
            {message && <p className="success-message">{message}</p>}
          </form>
        </div>
      )}
    </div>
  );
};

export default UserSettings;