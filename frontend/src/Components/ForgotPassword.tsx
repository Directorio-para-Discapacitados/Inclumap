import React, { useState } from 'react';
import { api } from '../config/api';
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
    <div>
      <h2>Restablecer Contraseña</h2>
      <p>Ingresa tu correo electrónico para enviarte un código de seguridad.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email-forgot">Email:</label>
          <input
            id="email-forgot"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="tu@correo.com"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Código'}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
};