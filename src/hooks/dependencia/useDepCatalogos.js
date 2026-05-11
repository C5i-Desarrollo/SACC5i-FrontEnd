import { useState, useEffect, useCallback } from 'react';
import { getTiposOficio, getMunicipios, getPuestos } from '../../services/api';

/**
 * Hook para manejo de catálogos de dependencia
 * Carga TODOS los municipios (sin filtro de región) y TODOS los puestos
 */
export const useDepCatalogos = () => {
  const [tiposOficio, setTiposOficio] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    setLoading(true);
    try {
      const [tiposRes, muniRes, puestosRes] = await Promise.all([
        getTiposOficio(),
        getMunicipios(),       // Sin filtro de región — dependencias ven todos
        getPuestos()
      ]);
      setTiposOficio(tiposRes.data.data || []);
      setMunicipios(muniRes.data.data || []);
      setPuestos(puestosRes.data.data || []);
    } catch (err) {
      console.error('Error al cargar catálogos dependencia:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  return {
    tiposOficio,
    municipios,
    puestos,
    loading,
    recargar: cargarCatalogos
  };
};
