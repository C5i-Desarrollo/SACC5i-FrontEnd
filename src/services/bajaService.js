import {
  crearBajaEditableApi,
  editarBajaEditableApi,
  eliminarBajaEditableApi,
  getBajasRegistradasApi,
  getBajasEditablesApi,
  getCatalogoBajasApi,
  getDisponiblesBajaApi,
  registrarBajaApi
} from './api';

export const obtenerCatalogoBajas = async () => {
  const { data } = await getCatalogoBajasApi();
  return data?.data?.catalogo || {};
};

export const obtenerDisponiblesBaja = async (params = {}) => {
  const { data } = await getDisponiblesBajaApi(params);
  return {
    registros: data?.data?.registros || [],
    paginacion: data?.data?.paginacion || { total: 0, totalPaginas: 1, pagina: 1 }
  };
};

export const obtenerBajasRegistradas = async (params = {}) => {
  const { data } = await getBajasRegistradasApi(params);
  return {
    registros: data?.data?.registros || [],
    paginacion: data?.data?.paginacion || { total: 0, totalPaginas: 1, pagina: 1 }
  };
};

export const registrarBaja = async (payload) => {
  await registrarBajaApi(payload);
};

export const obtenerBajasEditables = async (params = {}) => {
  const { data } = await getBajasEditablesApi(params);
  return {
    registros: data?.data?.registros || []
  };
};

export const crearBajaEditable = async (payload) => {
  const { data } = await crearBajaEditableApi({
    nombre_elemento: payload?.nombre_elemento,
    apellido_paterno: payload?.apellido_paterno,
    apellido_materno: payload?.apellido_materno,
    municipio_nombre: payload?.municipio_nombre,
    cuip: payload?.cuip,
    numero_oficio_municipio: payload?.numero_oficio_municipio,
    tipo_baja: payload?.baja_tipo,
    motivo_baja: payload?.baja_motivo,
    fecha_baja: payload?.baja_fecha,
    observaciones: payload?.observaciones
  });

  return data?.data?.registro || null;
};

export const editarBajaEditable = async (id, payload) => {
  const { data } = await editarBajaEditableApi(id, {
    nombre_elemento: payload?.nombre_elemento,
    apellido_paterno: payload?.apellido_paterno,
    apellido_materno: payload?.apellido_materno,
    municipio_nombre: payload?.municipio_nombre,
    cuip: payload?.cuip,
    numero_oficio_municipio: payload?.numero_oficio_municipio,
    tipo_baja: payload?.baja_tipo,
    motivo_baja: payload?.baja_motivo,
    fecha_baja: payload?.baja_fecha,
    observaciones: payload?.observaciones
  });

  return data?.data?.registro || null;
};

export const eliminarBajaEditable = async (id) => {
  await eliminarBajaEditableApi(id);
};
