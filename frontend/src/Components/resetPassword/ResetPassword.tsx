import React, { useState } from 'react';
import { api } from '../../config/api'; 
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

interface ResetPasswordProps {
  code: string; 
}

export const ResetPassword = ({ code }: ResetPasswordProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const uppercaseRegex = /[A-Z]/;
    if (!uppercaseRegex.test(newPassword)) {
      setError('La contraseña debe contener al menos una letra mayúscula.');
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
      setSuccess('¡Contraseña restablecida con éxito! Redirigiendo al login...');

      setTimeout(() => {
        navigate('/login');
      }, 2000); 

    } catch (err) {
      setLoading(false);
      setError('Error al restablecer. El código puede haber expirado.');
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <h2>Crear Nueva Contraseña</h2>
      <p className="form-description">Tu código ha sido verificado. Ahora, crea tu nueva contraseña.</p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="new-pass">Nueva Contraseña</label>
          <input
            id="new-pass"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            placeholder="Mínimo 6 caracteres con una mayúscula"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirm-pass">Confirmar Contraseña</label>
          <input
            id="confirm-pass"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="Repite tu contraseña"
          />
        </div>
        
        {!success && (
          <button 
            type="submit" 
            disabled={loading}
            className={`submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Restableciendo...
              </>
            ) : 'Restablecer Contraseña'}
          </button>
        )}

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}
      </form>
    </div>
  );
};