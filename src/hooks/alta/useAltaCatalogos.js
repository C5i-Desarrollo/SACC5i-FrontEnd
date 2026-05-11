import { useState, useEffect, useCallback } from 'react';
import { getTiposOficio, getMunicipios, getPuestos, getRegiones } from '../../services/api';

const CATALOG_CACHE_TTL_MS = 60 * 1000;
const municipiosCacheByRegion = new Map();
const municipiosInFlightByRegion = new Map();

let catalogosGlobalCache = null;
let catalogosGlobalInFlight = null;

/**
 * Hook para manejo de catálogos de alta
 * Carga y filtra catálogos necesarios para los formularios
 */
export const useAltaCatalogos = (user, regionSeleccionadaId = null) => {
  const [tiposOficio, setTiposOficio] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const esAdminMultiRegion = user?.rol === 'admin' || user?.rol === 'super_admin';
  const regionActivaId = esAdminMultiRegion
    ? (regionSeleccionadaId ? Number(regionSeleccionadaId) : null)
    : (user?.region_id ? Number(user.region_id) : null);

  const cargarCatalogosGlobales = useCallback(async () => {
    const now = Date.now();

    if (catalogosGlobalCache && now - catalogosGlobalCache.timestamp < CATALOG_CACHE_TTL_MS) {
      return catalogosGlobalCache.data;
    }

    if (catalogosGlobalInFlight) {
      return catalogosGlobalInFlight;
    }

    catalogosGlobalInFlight = Promise.all([
      getTiposOficio(),
      getPuestos(),
      getRegiones()
    ]).then(([tiposRes, puestosRes, regionesRes]) => {
      const data = {
        tiposOficio: tiposRes.data.data || [],
        puestos: puestosRes.data.data || [],
        regiones: regionesRes.data.data || []
      };

      catalogosGlobalCache = {
        data,
        timestamp: Date.now()
      };

      return data;
    }).finally(() => {
      catalogosGlobalInFlight = null;
    });

    return catalogosGlobalInFlight;
  }, []);

  const cargarMunicipiosPorRegion = useCallback(async (regionId) => {
    if (!regionId) {
      return [];
    }

    const now = Date.now();
    const cached = municipiosCacheByRegion.get(regionId);
    if (cached && now - cached.timestamp < CATALOG_CACHE_TTL_MS) {
      return cached.data;
    }

    const inFlight = municipiosInFlightByRegion.get(regionId);
    if (inFlight) {
      return inFlight;
    }

    const requestPromise = getMunicipios({ region_id: regionId })
      .then((res) => {
        const data = res.data.data || [];
        municipiosCacheByRegion.set(regionId, {
          data,
          timestamp: Date.now()
        });
        return data;
      })
      .finally(() => {
        municipiosInFlightByRegion.delete(regionId);
      });

    municipiosInFlightByRegion.set(regionId, requestPromise);
    return requestPromise;
  }, []);

  /**
   * Cargar todos los catálogos necesarios
   */
  const cargarCatalogos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const globalData = await cargarCatalogosGlobales();
      const municipiosData = await cargarMunicipiosPorRegion(regionActivaId);

      const data = {
        tiposOficio: globalData.tiposOficio,
        puestos: globalData.puestos,
        regiones: globalData.regiones,
        municipios: municipiosData
      };

      setTiposOficio(data.tiposOficio);
      setPuestos(data.puestos);
      setRegiones(data.regiones);
      setMunicipios(data.municipios);

      return data;
    } catch (err) {
      const errorMsg = 'Error al cargar catálogos';
      setError(errorMsg);
      console.error('Error al cargar catálogos:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarCatalogosGlobales, cargarMunicipiosPorRegion, regionActivaId]);

  /**
   * Cargar catálogos al montar o cuando cambie el usuario
   */
  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  /**
   * Obtener municipio por ID
   */
  const getMunicipioPorId = useCallback((id) => {
    return municipios.find(m => m.id === parseInt(id));
  }, [municipios]);

  /**
   * Obtener tipo oficio por ID
   */
  const getTipoOficioPorId = useCallback((id) => {
    return tiposOficio.find(t => t.id === parseInt(id));
  }, [tiposOficio]);

  return {
    // Estados
    tiposOficio,
    regiones,
    municipios,
    puestos,
    regionActivaId,
    loading,
    error,
    
    // Acciones
    cargarCatalogos,
    getMunicipioPorId,
    getTipoOficioPorId
  };
};
