// frontend/src/Components/Avatar/Avatar.tsx

import React from 'react';
import './Avatar.css';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | number;
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
  
  // Agregar cache buster para evitar problemas de caché del navegador
  const getImageSrc = () => {
    if (!src) return defaultAvatar;
    // Si la URL ya tiene parámetros, usar &, si no usar ?
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}t=${Date.now()}`;
  };
  
  const getAvatarStyle = () => {
    if (typeof size === 'number') {
      return {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
    }
    return {};
  };

  const getImageStyle = () => {
    if (typeof size === 'number') {
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
      };
    }
    return {};
  };
  
  return (
    <div 
      className={`avatar ${typeof size === 'string' ? `avatar-${size}` : ''} ${className} ${onClick ? 'avatar-clickable' : ''}`}
      style={getAvatarStyle()}
      onClick={onClick}
    >
      <img 
        src={getImageSrc()} 
        alt={alt}
        style={getImageStyle()}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = defaultAvatar;
        }}
      />
    </div>
  );
}