// frontend/src/Components/Avatar/Avatar.tsx

import React from 'react';
import './Avatar.css';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

export default function Avatar({ 
  src, 
  alt = "Avatar", 
  size = 'medium', 
  className = '', 
  onClick 
}: AvatarProps) {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/711/711769.png";
  
  return (
    <div 
      className={`avatar avatar-${size} ${className} ${onClick ? 'avatar-clickable' : ''}`}
      onClick={onClick}
    >
      <img 
        src={src || defaultAvatar} 
        alt={alt}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = defaultAvatar;
        }}
      />
    </div>
  );
}