import React, { useState } from 'react';
import { api } from '../../config/api';
import './CodeVerification.css';

interface CodeVerificationProps {
  email: string;
  onCodeVerified: (code: string) => void;
}

export const CodeVerification = ({ email, onCodeVerified }: CodeVerificationProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!code || code.length < 6) {
      setError('El código debe tener 6 dígitos.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/verify-reset-code', { code });

      if (response.data.isValid) {
        setLoading(false);
        onCodeVerified(code);
      } else {
        setLoading(false);
        setError('Código inválido o expirado. Intenta de nuevo.');
      }
    } catch (err) {
      setLoading(false);
      setError('Código inválido o expirado. Intenta de nuevo.');
    }
  };

  return (
    <div className="form-container">
      <h2>Verifica tu Identidad</h2>
      <p className="form-description">Enviamos un código de 6 dígitos a: <strong>{email}</strong></p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="code">Código de Seguridad</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            maxLength={6}
            placeholder="000000"
            className="code-input"
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
              Verificando...
            </>
          ) : 'Verificar Código'}
        </button>

        {error && <div className="message error">{error}</div>}
      </form>
    </div>
  );
};
