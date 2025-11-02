import React, { useState } from 'react';
import { api } from '../../config/api'; 
import './ForgotPassword.css';

interface ForgotPasswordProps {
  onCodeSent: (email: string) => void;
}

export const ForgotPassword = ({ onCodeSent }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email) {
      setError('El email es obligatorio.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/request-reset-password', {
        user_email: email,
      });

      setLoading(false);
      setSuccess('¡Código enviado! Revisa tu correo electrónico.');
      
      setTimeout(() => {
        onCodeSent(email);
      }, 2000);

    } catch (err) {
      setLoading(false);
      setError('Error al enviar la solicitud. Verifica tu correo.');
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <h2>Restablecer Contraseña</h2>
      <p className="form-description">Ingresa tu correo electrónico para enviarte un código de seguridad.</p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email-forgot">Email</label>
          <input
            id="email-forgot"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="tu@correo.com"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Enviando...
            </>
          ) : 'Enviar Código'}
        </button>

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}
      </form>
    </div>
  );
};