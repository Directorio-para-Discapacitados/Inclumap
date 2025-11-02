import React, { useState } from 'react';
import { api } from '../config/api';

interface ResetPasswordProps {
  email?: string; 
}

export const ResetPassword = ({ email }: ResetPasswordProps) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!code || code.length < 6) {
      setError('El código de seguridad es obligatorio (6 dígitos).');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        code: code,
        newPassword: newPassword,
      });

      setLoading(false);
      setSuccess('¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.');

    } catch (err) {
      setLoading(false);
      setError('Error al restablecer. El código puede ser inválido o haber expirado.');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Crear Nueva Contraseña</h2>
      {email && <p>Enviamos un código a: <strong>{email}</strong></p>}
      {!email && <p>Revisa tu correo e ingresa el código de 6 dígitos.</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="code">Código de Seguridad:</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            maxLength={6}
          />
        </div>
        <div>
          <label htmlFor="new-pass">Nueva Contraseña:</label>
          <input
            id="new-pass"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="confirm-pass">Confirmar Contraseña:</label>
          <input
            id="confirm-pass"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
};