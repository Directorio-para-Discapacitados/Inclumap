import React from 'react';
import { Link } from 'react-router-dom';
import { useSpeakable } from '../../hooks/useSpeakable';
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
  const { onMouseEnter, onFocus } = useSpeakable({
    customText: description ? `${title}. ${description}` : title
  });

  return (
    <Link 
      to={route} 
      className="management-card"
      aria-label={description ? `${title}. ${description}` : title}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
    >
      <div className="card-icon-wrapper">
        <span className="card-icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="card-arrow" aria-hidden="true">→</div>
    </Link>
  );
};

export default ManagementCard;
