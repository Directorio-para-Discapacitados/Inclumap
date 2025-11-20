import React, { useState, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import "./LocationPicker.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface LocationPickerProps {
  initialLat: number;
  initialLng: number;
  onConfirm: (lat: number, lng: number, address?: string) => void;
  onCancel: () => void;
}

export default function LocationPicker({ initialLat, initialLng, onConfirm, onCancel }: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    language: 'es',
  });

  const defaultCenter = { lat: initialLat || 4.6097, lng: initialLng || -74.0817 };
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [markerPos, setMarkerPos] = useState(defaultCenter);
  
  // La dirección se guarda aquí internamente, pero NO se muestra
  const [addressText, setAddressText] = useState("");
  
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    try {
      geocoder.current = new google.maps.Geocoder();
    } catch (e) {
      console.error("Error inicializando Geocoder:", e);
    }
    
    if (initialLat !== 0 && initialLng !== 0) {
      fetchAddress(initialLat, initialLng);
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCenter(newPos);
                setMarkerPos(newPos);
                fetchAddress(newPos.lat, newPos.lng);
            });
        }
    }
  }, [initialLat, initialLng]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Esta función corre en segundo plano
  const fetchAddress = (lat: number, lng: number) => {
    if (!geocoder.current) return;
    
    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const formatted = results[0].formatted_address; 
        const cleanAddress = formatted.replace(", Colombia", "");
        setAddressText(cleanAddress); // Guardamos el dato en memoria
      } else {
        setAddressText("");
      }
    });
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newPos = { lat, lng };
      setMarkerPos(newPos);
      fetchAddress(lat, lng);
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPos({ lat, lng });
      fetchAddress(lat, lng);
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCenter(newPos);
            setMarkerPos(newPos);
            map?.panTo(newPos);
            map?.setZoom(17);
            fetchAddress(newPos.lat, newPos.lng);
        }, () => {
            alert("No se pudo obtener tu ubicación.");
        });
    }
  };

  if (loadError) return <div className="lp-error-screen">Error al cargar Google Maps.</div>;
  if (!isLoaded) return <div className="lp-loading-screen">Cargando Mapa...</div>;

  return (
    <div className="location-picker-overlay" onClick={(e) => {
      // Si hacen clic directamente en el overlay (fondo oscuro), cerrar
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <div className="location-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lp-header">
          <h3>📍 Selecciona la ubicación</h3>
          <button className="lp-close-btn" onClick={onCancel}>&times;</button>
        </div>
        
        <div className="lp-map-container">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={16}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                clickableIcons: false
            }}
          >
            <MarkerF
              position={markerPos}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
            />
            
            <div className="google-locate-btn-container">
                <button type="button" className="locate-me-btn" onClick={handleLocateMe} title="Mi Ubicación">
                    🎯
                </button>
            </div>
          </GoogleMap>
        </div>

        <div className="lp-footer" style={{ justifyContent: 'flex-end' }}>
            <div className="lp-actions">
                <button className="lp-btn-cancel" onClick={onCancel}>Cancelar</button>
                <button 
                    className="lp-btn-confirm" 
                    // Al confirmar, enviamos la dirección oculta (addressText) al padre
                    onClick={() => onConfirm(markerPos.lat, markerPos.lng, addressText)}
                >
                    Confirmar Ubicación
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}