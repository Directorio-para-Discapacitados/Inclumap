// frontend/src/Components/Avatar/Avatar.tsx

import React, { useState, useEffect } from 'react';
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
  const [imageSrc, setImageSrc] = useState<string>(src || defaultAvatar);
  
  // Actualizar la imagen cuando cambia el src
  useEffect(() => {
    if (src) {
      // Agregar timestamp para evitar caché del navegador
      const separator = src.includes('?') ? '&' : '?';
      setImageSrc(`${src}${separator}v=${Date.now()}`);
    } else {
      setImageSrc(defaultAvatar);
    }
  }, [src]);
  
  const getImageSrc = () => {
    return imageSrc;
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