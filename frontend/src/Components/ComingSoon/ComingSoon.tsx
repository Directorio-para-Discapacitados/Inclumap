import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ComingSoon.css';

interface ComingSoonProps {
  moduleName: string;
  icon?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ moduleName, icon = '🚧' }) => {
  const navigate = useNavigate();

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-container">
        <div className="coming-soon-icon">{icon}</div>
        <h1 className="coming-soon-title">{moduleName}</h1>
        <p className="coming-soon-message">Este módulo estará disponible próximamente</p>
        <button 
          className="back-button-coming-soon"
          onClick={() => navigate('/')}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
