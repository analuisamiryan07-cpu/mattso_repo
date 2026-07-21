import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cursosService } from '@api/cursosService';

const CatalogContext = createContext(null);

export const CatalogProvider = ({ children }) => {
  const [certificaciones, setCertificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cursosService.getCertificaciones()
      .then(data => { setCertificaciones(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getCertBySlug = useCallback(
    (slug) => certificaciones.find(c => c.slug === slug) ?? null,
    [certificaciones]
  );

  const destacados = certificaciones.filter(c => c.destacado);

  return (
    <CatalogContext.Provider value={{ certificaciones, destacados, loading, getCertBySlug }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => useContext(CatalogContext);
