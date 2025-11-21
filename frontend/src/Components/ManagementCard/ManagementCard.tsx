import React from 'react';
import { Link } from 'react-router-dom';
import './ManagementCard.css';

interface ManagementCardProps {
  title: string;
  icon: string;
  route: string;
  description?: string;
}

const ManagementCard: React.FC<ManagementCardProps> = ({ 
  title, 
  icon, 
  route,
  description 
}) => {
  return (
    <Link to={route} className="management-card">
      <div className="card-icon-wrapper">
        <span className="card-icon">{icon}</span>
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="card-arrow">→</div>
    </Link>
  );
};

export default ManagementCard;
