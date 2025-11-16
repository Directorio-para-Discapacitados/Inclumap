import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./IncompleteProfileNotification.css";

interface IncompleteProfileNotificationProps {
  isDismissible?: boolean;
}

export default function IncompleteProfileNotification({
  isDismissible = false,
}: IncompleteProfileNotificationProps) {
  const { user } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [missingItems, setMissingItems] = useState<string[]>([]);

  useEffect(() => {
    // Mostrar notificación solo si:
    // 1. El usuario es propietario
    // 2. No tiene logo_url O no está verificado
    if (user?.roleDescription === "Propietario") {
      const missing: string[] = [];
      
      if (!user?.logo_url) {
        missing.push("logo");
      }
      if (!user?.verified) {
        missing.push("verificación");
      }

      if (missing.length > 0) {
        setMissingItems(missing);
        setShow(true);
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  }, [user?.logo_url, user?.verified, user?.roleDescription]);

  if (!show) {
    return null;
  }

  const handleClick = () => {
    navigate("/perfil");
  };

  const missingText = missingItems.includes("logo") && missingItems.includes("verificación")
    ? "Sube el logo de tu empresa para verificar tu negocio"
    : missingItems.includes("logo")
    ? "Sube el logo de tu empresa"
    : "Verifica tu negocio";

  return (
    <div
      className="incomplete-profile-notification"
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      <div className="notification-content">
        <div className="notification-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div className="notification-text">
          <strong>Por favor, completa tu información</strong>
          <p>{missingText}</p>
        </div>
        <div className="notification-action">
          <i className="fas fa-arrow-right"></i>
        </div>
      </div>
      {isDismissible && (
        <button
          className="notification-close"
          onClick={(e) => {
            e.stopPropagation();
            setShow(false);
          }}
          aria-label="Cerrar notificación"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
}
