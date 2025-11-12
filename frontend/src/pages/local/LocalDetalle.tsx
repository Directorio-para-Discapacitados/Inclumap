import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';
import '../inicio/inicio.css';

interface LocalData {
  business_id: number;
  business_name: string;
  address?: string;
  average_rating?: number;
  logo_url?: string;
  owner_name?: string;
  description?: string;
  coordinates?: string;
  latitude?: number;
  longitude?: number;
  business_accessibility?: Array<{ id: number; name?: string; description?: string }>;
}

const LocalDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LocalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usamos siempre el endpoint público para detalle
        const resp = await fetch(`${API_URL}/business/public/${id}`);
        if (!resp.ok) throw new Error('No se pudo obtener el local');
        const json = await resp.json();
        setData(json);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar el local');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  return (
    <div className="inicio-root" style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <button className="btn btn-outline" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {loading && <div className="loading" style={{ marginTop: '1rem' }}>Cargando...</div>}
      {error && !loading && <div className="error" style={{ marginTop: '1rem' }}>{error}</div>}

      {data && (
        <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0 }}>
            <div style={{ background: '#f1f5f9', minHeight: 220 }}>
              <img
                src={data.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'}
                alt={data.business_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '1.25rem' }}>
              <h1 className="biz-title" style={{ fontSize: '1.6rem', marginBottom: 8 }}>{data.business_name}</h1>
              <p className="biz-address" style={{ marginBottom: 12 }}>{data.address || 'Dirección no disponible'}</p>
              <div className="biz-meta" style={{ marginBottom: 16 }}>
                {typeof data.average_rating !== 'undefined' && (
                  <span className="biz-rating">⭐ {Number(data.average_rating).toFixed(1)}</span>
                )}
                {data.owner_name && (
                  <span className="biz-owner">Propietario: {data.owner_name}</span>
                )}
              </div>

              {/* Descripción */}
              {data.description && (
                <div style={{ color: '#475569', marginBottom: 16 }}>
                  <h2 className="biz-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Descripción</h2>
                  <p style={{ margin: 0 }}>{data.description}</p>
                </div>
              )}

              {/* Accesibilidades */}
              {Array.isArray(data.business_accessibility) && data.business_accessibility.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h2 className="biz-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Accesibilidades</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.business_accessibility.map((a) => (
                      <span key={a.id} className="biz-owner" title={a.description || ''}>
                        {a.name || 'Accesibilidad'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mapa / Coordenadas */}
              {(typeof data.latitude === 'number' && typeof data.longitude === 'number') || (data.coordinates && data.coordinates.includes(',')) ? (
                <div>
                  <h2 className="biz-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Ubicación</h2>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {(() => {
                      let lat = data.latitude;
                      let lon = data.longitude;
                      if ((lat == null || lon == null) && data.coordinates) {
                        const parts = data.coordinates.split(',').map((s) => parseFloat(s.trim()));
                        if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
                          lat = parts[0];
                          lon = parts[1];
                        }
                      }
                      if (lat != null && lon != null) {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                        return (
                          <a className="btn btn-outline" href={mapsUrl} target="_blank" rel="noreferrer">
                            Ver en Google Maps
                          </a>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      )}
    </div>
  );
};

export default LocalDetalle;
